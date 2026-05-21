import "dotenv/config";
import dns from "node:dns";
import { Resolver } from "node:dns/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { airlines, airports, lanes, rates } from "./schema";

const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

(dns as unknown as { lookup: (...args: unknown[]) => void }).lookup = (
  ...args: unknown[]
) => {
  const hostname = args[0] as string;
  let options: { all?: boolean; family?: number } = {};
  let callback: (...cbArgs: unknown[]) => void;
  if (typeof args[1] === "function") {
    callback = args[1] as (...cbArgs: unknown[]) => void;
  } else {
    options = (args[1] as typeof options) ?? {};
    callback = args[2] as (...cbArgs: unknown[]) => void;
  }

  resolver
    .resolve4(hostname)
    .then((addrs) => {
      if (!addrs || addrs.length === 0) {
        const err = Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), {
          code: "ENOTFOUND",
          errno: -3008,
          syscall: "getaddrinfo",
          hostname,
        });
        callback(err);
        return;
      }
      if (options.all) {
        callback(
          null,
          addrs.map((address) => ({ address, family: 4 })),
        );
      } else {
        callback(null, addrs[0], 4);
      }
    })
    .catch((err) => {
      callback(err);
    });
};

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client);

const AIRPORTS = [
  { iata: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", region: "Americas" },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", region: "Americas" },
  { iata: "ORD", name: "O'Hare International", city: "Chicago", country: "United States", region: "Americas" },
  { iata: "MEM", name: "Memphis International", city: "Memphis", country: "United States", region: "Americas" },
  { iata: "MIA", name: "Miami International", city: "Miami", country: "United States", region: "Americas" },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "United States", region: "Americas" },
  { iata: "SFO", name: "San Francisco International", city: "San Francisco", country: "United States", region: "Americas" },
  { iata: "SDF", name: "Louisville Muhammad Ali International", city: "Louisville", country: "United States", region: "Americas" },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", region: "Europe" },
  { iata: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "Germany", region: "Europe" },
  { iata: "LHR", name: "London Heathrow", city: "London", country: "United Kingdom", region: "Europe" },
  { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Netherlands", region: "Europe" },
  { iata: "CDG", name: "Paris Charles de Gaulle", city: "Paris", country: "France", region: "Europe" },
  { iata: "LUX", name: "Luxembourg Findel", city: "Luxembourg", country: "Luxembourg", region: "Europe" },
  { iata: "MAD", name: "Madrid Barajas", city: "Madrid", country: "Spain", region: "Europe" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", region: "Europe" },
  { iata: "DXB", name: "Dubai International", city: "Dubai", country: "United Arab Emirates", region: "Middle East" },
  { iata: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", region: "Middle East" },
  { iata: "AUH", name: "Zayed International", city: "Abu Dhabi", country: "United Arab Emirates", region: "Middle East" },
  { iata: "NRT", name: "Narita International", city: "Tokyo", country: "Japan", region: "Asia Pacific" },
  { iata: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "Hong Kong", region: "Asia Pacific" },
  { iata: "SIN", name: "Singapore Changi", city: "Singapore", country: "Singapore", region: "Asia Pacific" },
  { iata: "PVG", name: "Shanghai Pudong", city: "Shanghai", country: "China", region: "Asia Pacific" },
  { iata: "ICN", name: "Incheon International", city: "Seoul", country: "South Korea", region: "Asia Pacific" },
  { iata: "BLR", name: "Kempegowda International", city: "Bangalore", country: "India", region: "Asia Pacific" },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International", city: "Mumbai", country: "India", region: "Asia Pacific" },
  { iata: "DEL", name: "Indira Gandhi International", city: "Delhi", country: "India", region: "Asia Pacific" },
  { iata: "MEX", name: "Mexico City International", city: "Mexico City", country: "Mexico", region: "Americas" },
  { iata: "GRU", name: "Sao Paulo Guarulhos", city: "Sao Paulo", country: "Brazil", region: "Americas" },
];

const COMMON_DG = ["dg_class_2", "dg_class_3", "dg_class_6", "dg_class_9"];

const AIRLINES = [
  { iata: "EK", name: "Emirates SkyCargo", hub_iata: "DXB", reliability_score: 91, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", "live_animal", "valuable", ...COMMON_DG] },
  { iata: "LH", name: "Lufthansa Cargo", hub_iata: "FRA", reliability_score: 92, capabilities: ["temp_controlled", "cool_chain", "frozen", "pharma_gdp", "live_animal", "valuable", ...COMMON_DG] },
  { iata: "QR", name: "Qatar Airways Cargo", hub_iata: "DOH", reliability_score: 90, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", "valuable", ...COMMON_DG] },
  { iata: "TK", name: "Turkish Cargo", hub_iata: "IST", reliability_score: 84, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", ...COMMON_DG] },
  { iata: "CV", name: "Cargolux", hub_iata: "LUX", reliability_score: 89, capabilities: ["temp_controlled", "frozen", "live_animal", ...COMMON_DG] },
  { iata: "5X", name: "UPS Airlines", hub_iata: "SDF", reliability_score: 96, capabilities: ["temp_controlled", "pharma_gdp", "express", "dg_class_9"] },
  { iata: "FX", name: "FedEx Express", hub_iata: "MEM", reliability_score: 97, capabilities: ["temp_controlled", "pharma_gdp", "express", "dg_class_9"] },
  { iata: "NH", name: "ANA Cargo", hub_iata: "NRT", reliability_score: 93, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", ...COMMON_DG] },
  { iata: "CX", name: "Cathay Pacific Cargo", hub_iata: "HKG", reliability_score: 90, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", "live_animal", ...COMMON_DG] },
  { iata: "AF", name: "Air France-KLM Cargo", hub_iata: "CDG", reliability_score: 87, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", "live_animal", ...COMMON_DG] },
  { iata: "SQ", name: "Singapore Airlines Cargo", hub_iata: "SIN", reliability_score: 92, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", ...COMMON_DG] },
  { iata: "EY", name: "Etihad Cargo", hub_iata: "AUH", reliability_score: 86, capabilities: ["temp_controlled", "cool_chain", "pharma_gdp", ...COMMON_DG] },
];

type LaneSeed = {
  airline_iata: string;
  origin_iata: string;
  destination_iata: string;
  routing: string[];
  transit_days_min: number;
  transit_days_max: number;
  frequency_per_week: number;
};

const LANES: LaneSeed[] = [
  { airline_iata: "EK", origin_iata: "JFK", destination_iata: "DUB", routing: ["JFK", "DXB", "DUB"], transit_days_min: 2.0, transit_days_max: 3.5, frequency_per_week: 7 },
  { airline_iata: "LH", origin_iata: "JFK", destination_iata: "DUB", routing: ["JFK", "FRA", "DUB"], transit_days_min: 1.5, transit_days_max: 2.5, frequency_per_week: 14 },
  { airline_iata: "AF", origin_iata: "JFK", destination_iata: "DUB", routing: ["JFK", "CDG", "DUB"], transit_days_min: 1.5, transit_days_max: 2.5, frequency_per_week: 10 },
  { airline_iata: "TK", origin_iata: "JFK", destination_iata: "DUB", routing: ["JFK", "IST", "DUB"], transit_days_min: 2.5, transit_days_max: 4.0, frequency_per_week: 5 },
  { airline_iata: "FX", origin_iata: "JFK", destination_iata: "DUB", routing: ["JFK", "MEM", "CDG", "DUB"], transit_days_min: 1.0, transit_days_max: 2.0, frequency_per_week: 6 },

  { airline_iata: "LH", origin_iata: "ORD", destination_iata: "FRA", routing: ["ORD", "FRA"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 14 },
  { airline_iata: "AF", origin_iata: "ORD", destination_iata: "CDG", routing: ["ORD", "CDG"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 7 },
  { airline_iata: "CV", origin_iata: "ORD", destination_iata: "LUX", routing: ["ORD", "LUX"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 6 },

  { airline_iata: "EK", origin_iata: "LAX", destination_iata: "DXB", routing: ["LAX", "DXB"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 14 },
  { airline_iata: "QR", origin_iata: "LAX", destination_iata: "DOH", routing: ["LAX", "DOH"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 7 },
  { airline_iata: "NH", origin_iata: "LAX", destination_iata: "NRT", routing: ["LAX", "NRT"], transit_days_min: 0.5, transit_days_max: 1.0, frequency_per_week: 14 },
  { airline_iata: "CX", origin_iata: "LAX", destination_iata: "HKG", routing: ["LAX", "HKG"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 10 },
  { airline_iata: "SQ", origin_iata: "LAX", destination_iata: "SIN", routing: ["LAX", "SIN"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 7 },

  { airline_iata: "EK", origin_iata: "MIA", destination_iata: "DXB", routing: ["MIA", "DXB"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 7 },
  { airline_iata: "LH", origin_iata: "MIA", destination_iata: "FRA", routing: ["MIA", "FRA"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 14 },
  { airline_iata: "AF", origin_iata: "MIA", destination_iata: "GRU", routing: ["MIA", "CDG", "GRU"], transit_days_min: 2.0, transit_days_max: 3.0, frequency_per_week: 5 },

  { airline_iata: "EK", origin_iata: "BLR", destination_iata: "JFK", routing: ["BLR", "DXB", "JFK"], transit_days_min: 2.0, transit_days_max: 3.0, frequency_per_week: 7 },
  { airline_iata: "LH", origin_iata: "BLR", destination_iata: "FRA", routing: ["BLR", "FRA"], transit_days_min: 1.5, transit_days_max: 2.5, frequency_per_week: 5 },
  { airline_iata: "QR", origin_iata: "BLR", destination_iata: "JFK", routing: ["BLR", "DOH", "JFK"], transit_days_min: 2.0, transit_days_max: 3.0, frequency_per_week: 7 },
  { airline_iata: "EY", origin_iata: "BOM", destination_iata: "JFK", routing: ["BOM", "AUH", "JFK"], transit_days_min: 2.0, transit_days_max: 3.0, frequency_per_week: 4 },

  { airline_iata: "NH", origin_iata: "NRT", destination_iata: "JFK", routing: ["NRT", "JFK"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 7 },
  { airline_iata: "CX", origin_iata: "HKG", destination_iata: "JFK", routing: ["HKG", "JFK"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 10 },
  { airline_iata: "CX", origin_iata: "HKG", destination_iata: "FRA", routing: ["HKG", "FRA"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 14 },
  { airline_iata: "SQ", origin_iata: "SIN", destination_iata: "FRA", routing: ["SIN", "FRA"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 7 },

  { airline_iata: "5X", origin_iata: "ORD", destination_iata: "FRA", routing: ["ORD", "SDF", "CGN", "FRA"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 7 },
  { airline_iata: "FX", origin_iata: "MEM", destination_iata: "CDG", routing: ["MEM", "CDG"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 7 },
  { airline_iata: "FX", origin_iata: "LAX", destination_iata: "ICN", routing: ["LAX", "ICN"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 7 },

  { airline_iata: "LH", origin_iata: "FRA", destination_iata: "JFK", routing: ["FRA", "JFK"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 14 },
  { airline_iata: "AF", origin_iata: "CDG", destination_iata: "JFK", routing: ["CDG", "JFK"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 10 },

  { airline_iata: "AF", origin_iata: "JFK", destination_iata: "LHR", routing: ["JFK", "CDG", "LHR"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 10 },
  { airline_iata: "LH", origin_iata: "JFK", destination_iata: "LHR", routing: ["JFK", "FRA", "LHR"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 14 },
  { airline_iata: "EK", origin_iata: "JFK", destination_iata: "LHR", routing: ["JFK", "DXB", "LHR"], transit_days_min: 2.0, transit_days_max: 3.0, frequency_per_week: 7 },
  { airline_iata: "FX", origin_iata: "JFK", destination_iata: "LHR", routing: ["JFK", "MEM", "CDG", "LHR"], transit_days_min: 1.0, transit_days_max: 2.0, frequency_per_week: 6 },

  { airline_iata: "AF", origin_iata: "SFO", destination_iata: "LHR", routing: ["SFO", "CDG", "LHR"], transit_days_min: 1.5, transit_days_max: 2.5, frequency_per_week: 7 },
  { airline_iata: "LH", origin_iata: "SFO", destination_iata: "FRA", routing: ["SFO", "FRA"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 7 },
  { airline_iata: "EK", origin_iata: "SFO", destination_iata: "DXB", routing: ["SFO", "DXB"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 10 },

  { airline_iata: "LH", origin_iata: "JFK", destination_iata: "FRA", routing: ["JFK", "FRA"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 14 },
  { airline_iata: "AF", origin_iata: "JFK", destination_iata: "CDG", routing: ["JFK", "CDG"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 10 },
  { airline_iata: "AF", origin_iata: "JFK", destination_iata: "AMS", routing: ["JFK", "CDG", "AMS"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 7 },

  { airline_iata: "AF", origin_iata: "LAX", destination_iata: "LHR", routing: ["LAX", "CDG", "LHR"], transit_days_min: 1.5, transit_days_max: 2.5, frequency_per_week: 7 },
  { airline_iata: "LH", origin_iata: "LAX", destination_iata: "FRA", routing: ["LAX", "FRA"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 10 },

  { airline_iata: "LH", origin_iata: "LHR", destination_iata: "JFK", routing: ["LHR", "FRA", "JFK"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 14 },
  { airline_iata: "AF", origin_iata: "LHR", destination_iata: "JFK", routing: ["LHR", "CDG", "JFK"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 10 },

  { airline_iata: "CX", origin_iata: "HKG", destination_iata: "LAX", routing: ["HKG", "LAX"], transit_days_min: 1.0, transit_days_max: 1.5, frequency_per_week: 14 },
  { airline_iata: "CX", origin_iata: "HKG", destination_iata: "ORD", routing: ["HKG", "ORD"], transit_days_min: 1.5, transit_days_max: 2.0, frequency_per_week: 7 },
  { airline_iata: "SQ", origin_iata: "SIN", destination_iata: "JFK", routing: ["SIN", "FRA", "JFK"], transit_days_min: 2.0, transit_days_max: 2.5, frequency_per_week: 5 },
];

type RateSpec = {
  commodity_type: string;
  service_level: string;
  rate_multiplier: number;
  fuel_surcharge_pct: number;
  security_per_kg: number;
  handling_flat: number;
  min_weight_kg: number;
  max_weight_kg: number;
  min_charge_usd: number;
  capacity_kg: number;
  special_handling: string[];
};

function baseRatePerKg(origin: string, destination: string): number {
  const region = (iata: string): string => {
    const ap = AIRPORTS.find((a) => a.iata === iata);
    return ap?.region ?? "Other";
  };
  const oRegion = region(origin);
  const dRegion = region(destination);

  const isTransAtlantic =
    (oRegion === "Americas" && dRegion === "Europe") ||
    (oRegion === "Europe" && dRegion === "Americas");
  const isTransPacific =
    (oRegion === "Americas" && dRegion === "Asia Pacific") ||
    (oRegion === "Asia Pacific" && dRegion === "Americas");
  const isAsiaEurope =
    (oRegion === "Asia Pacific" && dRegion === "Europe") ||
    (oRegion === "Europe" && dRegion === "Asia Pacific");
  const isMiddleEast = oRegion === "Middle East" || dRegion === "Middle East";
  const intraRegion = oRegion === dRegion;

  if (intraRegion) return 1.8;
  if (isTransAtlantic) return 3.2;
  if (isTransPacific) return 3.0;
  if (isAsiaEurope) return 2.9;
  if (isMiddleEast) return 2.7;
  return 3.5;
}

function rateSpecs(): RateSpec[] {
  return [
    {
      commodity_type: "general",
      service_level: "general",
      rate_multiplier: 1.0,
      fuel_surcharge_pct: 18.0,
      security_per_kg: 0.18,
      handling_flat: 75.0,
      min_weight_kg: 45,
      max_weight_kg: 5000,
      min_charge_usd: 125,
      capacity_kg: 12000,
      special_handling: [],
    },
    {
      commodity_type: "general",
      service_level: "priority",
      rate_multiplier: 1.45,
      fuel_surcharge_pct: 20.0,
      security_per_kg: 0.22,
      handling_flat: 110.0,
      min_weight_kg: 45,
      max_weight_kg: 3000,
      min_charge_usd: 180,
      capacity_kg: 4500,
      special_handling: [],
    },
    {
      commodity_type: "general",
      service_level: "express",
      rate_multiplier: 1.95,
      fuel_surcharge_pct: 22.0,
      security_per_kg: 0.28,
      handling_flat: 160.0,
      min_weight_kg: 1,
      max_weight_kg: 1500,
      min_charge_usd: 260,
      capacity_kg: 2000,
      special_handling: [],
    },
    {
      commodity_type: "perishable",
      service_level: "priority",
      rate_multiplier: 1.55,
      fuel_surcharge_pct: 20.0,
      security_per_kg: 0.22,
      handling_flat: 145.0,
      min_weight_kg: 45,
      max_weight_kg: 4000,
      min_charge_usd: 195,
      capacity_kg: 3500,
      special_handling: ["cool_chain", "temp_controlled"],
    },
    {
      commodity_type: "pharma",
      service_level: "priority",
      rate_multiplier: 1.85,
      fuel_surcharge_pct: 22.0,
      security_per_kg: 0.28,
      handling_flat: 220.0,
      min_weight_kg: 1,
      max_weight_kg: 2500,
      min_charge_usd: 320,
      capacity_kg: 2200,
      special_handling: ["pharma_gdp", "temp_controlled", "cool_chain"],
    },
    {
      commodity_type: "dangerous",
      service_level: "general",
      rate_multiplier: 1.65,
      fuel_surcharge_pct: 20.0,
      security_per_kg: 0.32,
      handling_flat: 280.0,
      min_weight_kg: 45,
      max_weight_kg: 2000,
      min_charge_usd: 360,
      capacity_kg: 1800,
      special_handling: ["dg_class_2", "dg_class_3", "dg_class_6"],
    },
  ];
}

async function main() {
  console.log("Clearing existing lanes and rates...");
  await db.delete(rates);
  await db.delete(lanes);

  console.log("Upserting airports...");
  await db.insert(airports).values(AIRPORTS).onConflictDoNothing();

  console.log("Upserting airlines (capabilities may have changed)...");
  for (const a of AIRLINES) {
    await db
      .insert(airlines)
      .values(a)
      .onConflictDoUpdate({
        target: airlines.iata,
        set: { capabilities: a.capabilities, reliability_score: a.reliability_score, name: a.name, hub_iata: a.hub_iata },
      });
  }

  console.log("Seeding lanes and rates...");
  for (const laneSpec of LANES) {
    const airline = AIRLINES.find((a) => a.iata === laneSpec.airline_iata)!;
    const reliabilityJitter = (airline.reliability_score / 100 - 0.85) * 0.6;

    const [insertedLane] = await db
      .insert(lanes)
      .values({
        airline_iata: laneSpec.airline_iata,
        origin_iata: laneSpec.origin_iata,
        destination_iata: laneSpec.destination_iata,
        routing: laneSpec.routing,
        transit_days_min: laneSpec.transit_days_min.toString(),
        transit_days_max: laneSpec.transit_days_max.toString(),
        frequency_per_week: laneSpec.frequency_per_week,
      })
      .returning({ id: lanes.id });

    const base = baseRatePerKg(laneSpec.origin_iata, laneSpec.destination_iata);

    for (const spec of rateSpecs()) {
      const airlinePremium = airline.iata === "EK" || airline.iata === "QR" || airline.iata === "CX" ? 1.08 : 1.0;
      const expressPremium = airline.iata === "FX" || airline.iata === "5X" ? 0.92 : 1.0;
      const rate_per_kg = +(base * spec.rate_multiplier * airlinePremium * expressPremium * (1 + reliabilityJitter * 0.1)).toFixed(3);

      if (spec.special_handling.length > 0 && !spec.special_handling.every((h) => airline.capabilities.includes(h))) {
        continue;
      }

      await db.insert(rates).values({
        lane_id: insertedLane.id,
        commodity_type: spec.commodity_type,
        service_level: spec.service_level,
        min_weight_kg: spec.min_weight_kg.toString(),
        max_weight_kg: spec.max_weight_kg.toString(),
        rate_per_kg_usd: rate_per_kg.toString(),
        min_charge_usd: spec.min_charge_usd.toString(),
        fuel_surcharge_pct: spec.fuel_surcharge_pct.toString(),
        security_surcharge_per_kg_usd: spec.security_per_kg.toString(),
        handling_flat_usd: spec.handling_flat.toString(),
        capacity_available_kg: spec.capacity_kg.toString(),
        valid_from: new Date("2026-01-01"),
        valid_to: new Date("2026-12-31"),
        special_handling_supported: spec.special_handling,
      });
    }
  }

  console.log("Seed complete.");
  await client.end();
}

main().catch(async (err) => {
  console.error(err);
  await client.end();
  process.exit(1);
});
