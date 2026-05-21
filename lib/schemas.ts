import { z } from "zod";

export const CommodityType = z.enum([
  "general",
  "perishable",
  "pharma",
  "dangerous",
  "live_animal",
  "valuable",
  "express",
]);
export type CommodityType = z.infer<typeof CommodityType>;

export const ServiceLevel = z.enum(["economy", "general", "priority", "express"]);
export type ServiceLevel = z.infer<typeof ServiceLevel>;

export const SpecialHandling = z.enum([
  "temp_controlled",
  "cool_chain",
  "frozen",
  "pharma_gdp",
  "dg_class_1",
  "dg_class_2",
  "dg_class_3",
  "dg_class_4",
  "dg_class_5",
  "dg_class_6",
  "dg_class_7",
  "dg_class_8",
  "dg_class_9",
  "fragile",
  "aog",
  "human_remains",
  "live_animal",
]);
export type SpecialHandling = z.infer<typeof SpecialHandling>;

export const ShipmentRequest = z.object({
  origin_iata: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "IATA codes are 3 uppercase letters"),
  destination_iata: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "IATA codes are 3 uppercase letters"),
  pieces: z.number().int().positive(),
  gross_weight_kg: z.number().positive(),
  chargeable_weight_kg: z.number().positive(),
  dimensions_cm: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .nullable(),
  commodity_type: CommodityType,
  hs_code: z.string().nullable(),
  service_level: ServiceLevel,
  special_handling: z.array(SpecialHandling),
  ready_date: z.string().describe("ISO date when cargo is ready"),
  required_delivery_date: z.string().nullable(),
  shipper_country: z.string().nullable(),
  consignee_country: z.string().nullable(),
  notes: z.string().nullable(),
});
export type ShipmentRequest = z.infer<typeof ShipmentRequest>;

export const RateOption = z.object({
  airline_iata: z.string().length(2),
  airline_name: z.string(),
  flight_path: z.array(z.string()).describe("List of airport codes in routing"),
  transit_days: z.number(),
  ready_date: z.string(),
  arrival_date: z.string(),
  capacity_status: z.enum(["confirmed", "tentative", "request"]),
  reliability_score: z.number().min(0).max(100),
  price_breakdown: z.object({
    rate_per_kg_usd: z.number(),
    base_charge_usd: z.number(),
    fuel_surcharge_usd: z.number(),
    security_surcharge_usd: z.number(),
    handling_usd: z.number(),
    total_usd: z.number(),
  }),
  capabilities_match: z.array(z.string()).describe("Special handling supported"),
});
export type RateOption = z.infer<typeof RateOption>;

export const RankedOption = RateOption.extend({
  composite_score: z.number(),
  score_breakdown: z.object({
    price_score: z.number(),
    transit_score: z.number(),
    reliability_score: z.number(),
    capacity_score: z.number(),
  }),
  rationale: z.string(),
});
export type RankedOption = z.infer<typeof RankedOption>;

export const QuoteResponse = z.object({
  request: ShipmentRequest,
  options: z.array(RankedOption),
  recommendation_index: z.number().int(),
  recommendation_reasoning: z.string(),
  draft_email: z.string(),
});
export type QuoteResponse = z.infer<typeof QuoteResponse>;

export const AgentStep = z.discriminatedUnion("type", [
  z.object({ type: z.literal("extraction_start") }),
  z.object({ type: z.literal("extraction_done"), request: ShipmentRequest }),
  z.object({ type: z.literal("rate_query_start") }),
  z.object({
    type: z.literal("rate_query_done"),
    options: z.array(RateOption),
    candidate_count: z.number(),
  }),
  z.object({ type: z.literal("ranker_start") }),
  z.object({ type: z.literal("ranker_done"), ranked: z.array(RankedOption) }),
  z.object({ type: z.literal("drafter_start") }),
  z.object({ type: z.literal("drafter_done"), email: z.string() }),
  z.object({ type: z.literal("final"), response: QuoteResponse }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type AgentStep = z.infer<typeof AgentStep>;
