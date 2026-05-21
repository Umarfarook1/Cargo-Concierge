import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { modelChain } from "../llm";
import { ShipmentRequest } from "../schemas";
import { normalizeAirport } from "../airports";

const RawExtraction = z.object({
  origin_text: z.string().describe("Raw origin text as written by the forwarder, e.g. 'New York' or 'JFK'"),
  destination_text: z.string().describe("Raw destination text as written by the forwarder"),
  pieces: z.number().int().positive().nullable(),
  gross_weight_kg: z.number().positive().nullable().describe("Actual scale weight in kilograms"),
  chargeable_weight_kg: z
    .number()
    .positive()
    .nullable()
    .describe("Volumetric or actual, whichever is higher. If only gross given, set null."),
  dimensions_cm: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .nullable(),
  commodity_type: z.enum(["general", "perishable", "pharma", "dangerous", "live_animal", "valuable", "express"]),
  hs_code: z.string().nullable(),
  service_level: z.enum(["economy", "general", "priority", "express"]).describe("Default 'general' unless customer says rush/urgent/AOG (then 'express')"),
  special_handling: z.array(
    z.enum([
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
    ]),
  ),
  ready_date: z.string().describe("ISO date string YYYY-MM-DD. Default to today if not specified."),
  required_delivery_date: z.string().nullable(),
  shipper_country: z.string().nullable(),
  consignee_country: z.string().nullable(),
  notes: z.string().nullable(),
});

const INSTRUCTIONS = `You extract structured shipment details from a freight forwarder's free-form email, chat message, or quote request.

Rules:
- Pull every field present. Set unknown fields to null (do not guess).
- Map natural names to airports yourself only if obvious (e.g. "Heathrow" -> "London"). Keep the raw text in origin_text and destination_text; an external normalizer will resolve them.
- Chargeable weight = max(actual weight, volumetric weight). Volumetric = (L cm * W cm * H cm) / 6000 per kg for air freight. If only one is given, infer the other only when dimensions are explicit.
- Commodity types:
  - perishable: fresh food, flowers, seafood, fruit, vegetables
  - pharma: pharmaceuticals, vaccines, biologics, clinical trials
  - dangerous: lithium batteries, chemicals, flammables, aerosols
  - live_animal: pets, livestock, zoo animals
  - valuable: jewellery, art, high-value electronics
  - express: when sender explicitly asks for next-flight-out
  - general: everything else
- Service level defaults to "general" unless the message uses words like rush, urgent, ASAP, AOG, next flight, time-critical -> "express", or "priority"/"premium"/"high priority" -> "priority".
- Special handling flags are independent of commodity. A pharma shipment usually needs pharma_gdp + temp_controlled or cool_chain. Fresh seafood usually needs cool_chain. Lithium batteries are dg_class_9.
- Today's date: ${new Date().toISOString().slice(0, 10)}. Resolve "Friday", "next Monday", "EOD Thursday" relative to today.
- Do not invent details. If the message says "around 1 ton", set gross_weight_kg to 1000 and leave chargeable_weight_kg null.
- Notes field: capture any caveats like "shipper has CSA bonded warehouse", "consignee requires advance pre-alert", "must avoid US transit".`;

export const extractionAgent = new Agent({
  id: "extraction",
  name: "Shipment Extraction Agent",
  description: "Extracts structured shipment details from a free-form freight forwarder request.",
  instructions: INSTRUCTIONS,
  model: modelChain(),
});

export type ExtractionResult = {
  request: import("../schemas").ShipmentRequest;
  warnings: string[];
};

export async function extractShipment(raw_input: string): Promise<ExtractionResult> {
  const result = await extractionAgent.generate(
    [{ role: "user", content: raw_input }],
    { structuredOutput: { schema: RawExtraction } },
  );

  const r = result.object as z.infer<typeof RawExtraction>;
  const warnings: string[] = [];

  const looksLikeNoShipment =
    !r.origin_text ||
    !r.destination_text ||
    r.origin_text.toLowerCase() === "null" ||
    r.destination_text.toLowerCase() === "null" ||
    r.origin_text.toLowerCase() === "unknown" ||
    r.destination_text.toLowerCase() === "unknown";

  if (looksLikeNoShipment) {
    throw new Error(
      "Could not find a shipment in your message. Paste a forwarder request with at least an origin, destination, and weight.",
    );
  }

  const origin_iata = normalizeAirport(r.origin_text);
  const destination_iata = normalizeAirport(r.destination_text);

  if (!origin_iata) {
    throw new Error(
      `Could not resolve origin airport from "${r.origin_text}". Try an IATA code (e.g. JFK) or a major city name.`,
    );
  }
  if (!destination_iata) {
    throw new Error(
      `Could not resolve destination airport from "${r.destination_text}". Try an IATA code (e.g. DUB) or a major city name.`,
    );
  }

  let chargeable = r.chargeable_weight_kg;
  if (chargeable == null && r.gross_weight_kg != null && r.dimensions_cm) {
    const volumetric = (r.dimensions_cm.length * r.dimensions_cm.width * r.dimensions_cm.height) / 6000;
    chargeable = Math.max(r.gross_weight_kg, volumetric);
  } else if (chargeable == null && r.gross_weight_kg != null) {
    chargeable = r.gross_weight_kg;
    warnings.push("No dimensions given; using gross weight as chargeable weight");
  }

  if (chargeable == null) {
    throw new Error("Cannot determine chargeable weight: no weight or dimensions in the request");
  }

  const request: ShipmentRequest = {
    origin_iata,
    destination_iata,
    pieces: r.pieces ?? 1,
    gross_weight_kg: r.gross_weight_kg ?? chargeable,
    chargeable_weight_kg: chargeable,
    dimensions_cm: r.dimensions_cm,
    commodity_type: r.commodity_type,
    hs_code: r.hs_code,
    service_level: r.service_level,
    special_handling: r.special_handling,
    ready_date: r.ready_date,
    required_delivery_date: r.required_delivery_date,
    shipper_country: r.shipper_country,
    consignee_country: r.consignee_country,
    notes: r.notes,
  };

  return { request, warnings };
}
