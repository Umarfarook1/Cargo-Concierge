import { db } from "../db/client";
import { airlines, lanes, rates } from "../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import type { RateOption, ShipmentRequest } from "../schemas";

export async function queryRates(req: ShipmentRequest): Promise<{ options: RateOption[]; candidate_count: number }> {
  const candidateLanes = await db
    .select()
    .from(lanes)
    .innerJoin(airlines, eq(lanes.airline_iata, airlines.iata))
    .where(
      and(
        eq(lanes.origin_iata, req.origin_iata),
        eq(lanes.destination_iata, req.destination_iata),
      ),
    );

  if (candidateLanes.length === 0) {
    return { options: [], candidate_count: 0 };
  }

  const options: RateOption[] = [];
  let candidate_count = 0;

  for (const { lanes: lane, airlines: airline } of candidateLanes) {
    const laneRates = await db
      .select()
      .from(rates)
      .where(
        and(
          eq(rates.lane_id, lane.id),
          eq(rates.commodity_type, req.commodity_type),
          lte(rates.min_weight_kg, req.chargeable_weight_kg.toString()),
          gte(rates.max_weight_kg, req.chargeable_weight_kg.toString()),
        ),
      );

    for (const rate of laneRates) {
      candidate_count++;

      if (req.service_level === "express" && rate.service_level !== "express") continue;
      if (req.service_level === "priority" && rate.service_level === "economy") continue;
      if (req.service_level === "general" && rate.service_level === "express") continue;

      const requiredHandling = req.special_handling;
      if (requiredHandling.length > 0) {
        const supported = new Set(rate.special_handling_supported);
        const airlineCaps = new Set(airline.capabilities);
        const allSupported = requiredHandling.every((h) => supported.has(h) || airlineCaps.has(h));
        if (!allSupported) continue;
      }

      const capacity = Number(rate.capacity_available_kg);
      if (capacity < req.chargeable_weight_kg) continue;

      const rate_per_kg = Number(rate.rate_per_kg_usd);
      const min_charge = Number(rate.min_charge_usd);
      const fuel_pct = Number(rate.fuel_surcharge_pct);
      const security_per_kg = Number(rate.security_surcharge_per_kg_usd);
      const handling_flat = Number(rate.handling_flat_usd);

      const base_charge = Math.max(rate_per_kg * req.chargeable_weight_kg, min_charge);
      const fuel_surcharge = base_charge * (fuel_pct / 100);
      const security_surcharge = security_per_kg * req.chargeable_weight_kg;
      const total =
        Math.round((base_charge + fuel_surcharge + security_surcharge + handling_flat) * 100) / 100;

      const transit_mid = (Number(lane.transit_days_min) + Number(lane.transit_days_max)) / 2;
      const ready = new Date(req.ready_date);
      const arrival = new Date(ready.getTime() + transit_mid * 24 * 60 * 60 * 1000);

      const capacity_ratio = capacity / req.chargeable_weight_kg;
      const capacity_status: RateOption["capacity_status"] =
        capacity_ratio > 8 ? "confirmed" : capacity_ratio > 3 ? "tentative" : "request";

      const capabilities_match = [
        ...new Set([...rate.special_handling_supported, ...airline.capabilities]),
      ].filter((c) => requiredHandling.includes(c as never));

      options.push({
        airline_iata: airline.iata,
        airline_name: airline.name,
        flight_path: lane.routing,
        transit_days: Math.round(transit_mid * 10) / 10,
        ready_date: req.ready_date,
        arrival_date: arrival.toISOString().slice(0, 10),
        capacity_status,
        reliability_score: airline.reliability_score,
        price_breakdown: {
          rate_per_kg_usd: rate_per_kg,
          base_charge_usd: Math.round(base_charge * 100) / 100,
          fuel_surcharge_usd: Math.round(fuel_surcharge * 100) / 100,
          security_surcharge_usd: Math.round(security_surcharge * 100) / 100,
          handling_usd: handling_flat,
          total_usd: total,
        },
        capabilities_match,
      });
    }
  }

  return { options, candidate_count };
}
