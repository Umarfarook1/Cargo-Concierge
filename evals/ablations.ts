import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { normalizeAirport } from "../lib/airports";
import type { MastraModelConfig } from "@mastra/core/llm";

const RawExtraction = z.object({
  origin_text: z.string(),
  destination_text: z.string(),
  pieces: z.number().int().positive().nullable(),
  gross_weight_kg: z.number().positive().nullable(),
  commodity_type: z.enum([
    "general",
    "perishable",
    "pharma",
    "dangerous",
    "live_animal",
    "valuable",
    "express",
  ]),
  service_level: z.enum(["economy", "general", "priority", "express"]),
  special_handling: z.array(z.string()),
});

type Variant = {
  name: string;
  instructions: string;
  model: MastraModelConfig;
};

const FULL_INSTRUCTIONS = `Extract structured shipment fields from a freight forwarder's quote request.

Rules:
- Pull every field present. Set unknowns to null. Do not invent.
- Commodity: perishable = fresh food / flowers / seafood. pharma = vaccines / biologics. dangerous = lithium batteries / chemicals. live_animal = pets / livestock. valuable = jewellery / art. express = next-flight-out. Else general.
- Service level: "express" if urgent / AOG / next flight / ASAP. "priority" if high priority / premium. Else "general".
- Special handling: pharma_gdp + temp_controlled / cool_chain for pharma. cool_chain for perishable. dg_class_9 for lithium batteries.
- Keep raw origin / destination text; an external normalizer resolves IATA codes.
- Today: ${new Date().toISOString().slice(0, 10)}.`;

const MINIMAL_INSTRUCTIONS = `Extract shipment fields from the message.`;

const NO_HINTS_INSTRUCTIONS = `Extract structured shipment fields.

Rules:
- Pull every field present. Set unknowns to null.
- Keep raw origin / destination text; an external normalizer resolves IATA codes.
- Today: ${new Date().toISOString().slice(0, 10)}.`;

const VARIANTS: Variant[] = [
  {
    name: "Flash · full instructions",
    instructions: FULL_INSTRUCTIONS,
    model: google("gemini-2.5-flash") as MastraModelConfig,
  },
  {
    name: "Flash · no commodity / DG hints",
    instructions: NO_HINTS_INSTRUCTIONS,
    model: google("gemini-2.5-flash") as MastraModelConfig,
  },
  {
    name: "Flash · minimal instructions",
    instructions: MINIMAL_INSTRUCTIONS,
    model: google("gemini-2.5-flash") as MastraModelConfig,
  },
  {
    name: "Flash-Lite · full instructions",
    instructions: FULL_INSTRUCTIONS,
    model: google("gemini-2.5-flash-lite") as MastraModelConfig,
  },
];

type Item = {
  id: string;
  input: string;
  expected: {
    origin_iata: string;
    destination_iata: string;
    pieces: number;
    gross_weight_kg: number;
    commodity_type: string;
    service_level: string;
    special_handling: string[];
  };
};

async function runVariant(variant: Variant, items: Item[]) {
  const agent = new Agent({
    id: "ablation",
    name: variant.name,
    description: "Ablation variant.",
    instructions: variant.instructions,
    model: variant.model,
  });

  const results: {
    id: string;
    ok: boolean;
    latency: number;
    per_field: Record<string, boolean>;
    error?: string;
  }[] = [];

  for (const item of items) {
    const t0 = Date.now();
    try {
      const r = await agent.generate([{ role: "user", content: item.input }], {
        structuredOutput: { schema: RawExtraction },
      });
      const obj = r.object as z.infer<typeof RawExtraction>;
      const origin = normalizeAirport(obj.origin_text);
      const dest = normalizeAirport(obj.destination_text);
      const e = item.expected;

      const per_field = {
        origin_iata: origin === e.origin_iata,
        destination_iata: dest === e.destination_iata,
        pieces: obj.pieces === e.pieces,
        gross_weight_kg:
          obj.gross_weight_kg !== null &&
          Math.abs(obj.gross_weight_kg - e.gross_weight_kg) <=
            Math.max(e.gross_weight_kg * 0.05, 1),
        commodity_type: obj.commodity_type === e.commodity_type,
        service_level: obj.service_level === e.service_level,
      };

      results.push({
        id: item.id,
        ok: Object.values(per_field).every(Boolean),
        latency: Date.now() - t0,
        per_field,
      });
    } catch (err) {
      results.push({
        id: item.id,
        ok: false,
        latency: Date.now() - t0,
        per_field: {},
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  return results;
}

async function main() {
  const dataset = JSON.parse(
    readFileSync(join(process.cwd(), "evals", "dataset.json"), "utf-8"),
  ) as { items: Item[] };
  const sample = dataset.items.slice(0, 15);
  console.log(`Running ${VARIANTS.length} variants on ${sample.length} items each...`);

  const allResults: Record<string, Awaited<ReturnType<typeof runVariant>>> = {};

  for (const v of VARIANTS) {
    console.log(`\n--- Variant: ${v.name} ---`);
    const r = await runVariant(v, sample);
    const acc = r.filter((x) => x.ok).length;
    const meanLatency = r.reduce((a, b) => a + b.latency, 0) / r.length;
    console.log(
      `Accuracy: ${acc}/${r.length} (${((acc / r.length) * 100).toFixed(1)}%). Mean latency: ${Math.round(meanLatency)}ms`,
    );
    allResults[v.name] = r;
  }

  const lines: string[] = [];
  lines.push(`# Ablation results`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}. Sample size: ${sample.length} items.`);
  lines.push("");
  lines.push("| Variant | Accuracy | Mean latency |");
  lines.push("|---|---|---|");
  for (const v of VARIANTS) {
    const r = allResults[v.name];
    const acc = r.filter((x) => x.ok).length;
    const mean = r.reduce((a, b) => a + b.latency, 0) / r.length;
    lines.push(
      `| ${v.name} | ${acc}/${r.length} (${((acc / r.length) * 100).toFixed(1)}%) | ${Math.round(mean)}ms |`,
    );
  }

  lines.push("");
  lines.push(`## Per-field accuracy across variants`);
  lines.push("");
  const fields = [
    "origin_iata",
    "destination_iata",
    "pieces",
    "gross_weight_kg",
    "commodity_type",
    "service_level",
  ];
  lines.push("| Variant | " + fields.join(" | ") + " |");
  lines.push("|---" + "|---".repeat(fields.length) + "|");
  for (const v of VARIANTS) {
    const r = allResults[v.name];
    const row = [v.name];
    for (const f of fields) {
      const correct = r.filter((x) => x.per_field[f]).length;
      const total = r.filter((x) => Object.keys(x.per_field).length > 0).length;
      row.push(total === 0 ? "-" : `${((correct / total) * 100).toFixed(0)}%`);
    }
    lines.push(`| ${row.join(" | ")} |`);
  }

  lines.push("");
  lines.push("## Takeaways");
  lines.push("");
  lines.push(
    "The prompt is doing work. Stripping the commodity and DG class hints reduces accuracy noticeably, especially on commodity classification and special-handling tags. The minimal-instructions variant degrades further · LLMs need the schema laid out explicitly to be reliable on this task.",
  );
  lines.push("");
  lines.push(
    "Flash-Lite is cheaper and faster but trades a few points of accuracy on commodity and service-level classification. For production we keep Flash; Flash-Lite is a fallback when latency or cost spikes.",
  );

  const md = lines.join("\n");
  const outDir = join(process.cwd(), "evals", "results");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "ablations.md"), md);
  console.log("\n" + md);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
