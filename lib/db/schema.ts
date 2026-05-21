import {
  pgTable,
  serial,
  varchar,
  integer,
  numeric,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const airlines = pgTable("airlines", {
  iata: varchar("iata", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  hub_iata: varchar("hub_iata", { length: 3 }).notNull(),
  reliability_score: integer("reliability_score").notNull(),
  capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
});

export const lanes = pgTable(
  "lanes",
  {
    id: serial("id").primaryKey(),
    airline_iata: varchar("airline_iata", { length: 2 })
      .notNull()
      .references(() => airlines.iata),
    origin_iata: varchar("origin_iata", { length: 3 }).notNull(),
    destination_iata: varchar("destination_iata", { length: 3 }).notNull(),
    routing: jsonb("routing").$type<string[]>().notNull(),
    transit_days_min: numeric("transit_days_min", { precision: 4, scale: 1 }).notNull(),
    transit_days_max: numeric("transit_days_max", { precision: 4, scale: 1 }).notNull(),
    frequency_per_week: integer("frequency_per_week").notNull(),
  },
  (t) => [
    index("lane_origin_dest_idx").on(t.origin_iata, t.destination_iata),
    index("lane_airline_idx").on(t.airline_iata),
  ],
);

export const rates = pgTable(
  "rates",
  {
    id: serial("id").primaryKey(),
    lane_id: integer("lane_id")
      .notNull()
      .references(() => lanes.id),
    commodity_type: varchar("commodity_type", { length: 32 }).notNull(),
    service_level: varchar("service_level", { length: 16 }).notNull(),
    min_weight_kg: numeric("min_weight_kg", { precision: 10, scale: 2 }).notNull(),
    max_weight_kg: numeric("max_weight_kg", { precision: 10, scale: 2 }).notNull(),
    rate_per_kg_usd: numeric("rate_per_kg_usd", { precision: 8, scale: 3 }).notNull(),
    min_charge_usd: numeric("min_charge_usd", { precision: 10, scale: 2 }).notNull(),
    fuel_surcharge_pct: numeric("fuel_surcharge_pct", { precision: 5, scale: 2 }).notNull(),
    security_surcharge_per_kg_usd: numeric("security_surcharge_per_kg_usd", {
      precision: 6,
      scale: 3,
    }).notNull(),
    handling_flat_usd: numeric("handling_flat_usd", { precision: 8, scale: 2 }).notNull(),
    capacity_available_kg: numeric("capacity_available_kg", { precision: 12, scale: 2 }).notNull(),
    valid_from: timestamp("valid_from").notNull(),
    valid_to: timestamp("valid_to").notNull(),
    special_handling_supported: jsonb("special_handling_supported")
      .$type<string[]>()
      .notNull()
      .default([]),
  },
  (t) => [
    index("rate_lane_idx").on(t.lane_id),
    index("rate_commodity_idx").on(t.commodity_type),
  ],
);

export const airports = pgTable("airports", {
  iata: varchar("iata", { length: 3 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  city: varchar("city", { length: 64 }).notNull(),
  country: varchar("country", { length: 64 }).notNull(),
  region: varchar("region", { length: 32 }).notNull(),
});

export const quoteRuns = pgTable("quote_runs", {
  id: serial("id").primaryKey(),
  raw_input: text("raw_input").notNull(),
  extracted: jsonb("extracted"),
  options: jsonb("options"),
  ranked: jsonb("ranked"),
  draft_email: text("draft_email"),
  total_ms: integer("total_ms"),
  total_tokens: integer("total_tokens"),
  total_cost_usd: numeric("total_cost_usd", { precision: 8, scale: 4 }),
  model_used: varchar("model_used", { length: 64 }),
  error: text("error"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
