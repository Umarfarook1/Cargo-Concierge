import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { normalizeAirport } from "../lib/airports";
import type { MastraModelConfig } from "@mastra/core/llm";

const RawExtraction = z.object({
  origin_text: z.string(),
  destination_text: z.string(),
  pieces: z.number().int().positive().nullable(),
  gross_weight_kg: z.number().positive().nullable(),
  commodity_type: z.enum(["general", "perishable", "pharma", "dangerous", "live_animal", "valuable", "express"]),
  service_level: z.enum(["economy", "general", "priority", "express"]),
  special_handling: z.array(z.string()),
});

type Variant = {
  name: string;
  instructions: string;
  model: MastraModelConfig;
};

const BASE_INSTRUCTIONS = `Extract structured shipment fields. Pull every field present. Map natural city names to airports yourself only if obvious. Map commodity types: pharma includes vaccines/biologics, perishable includes fresh food/flowers/seafood, dangerous includes lithium batteries/chemicals. Service level: "express" if urgent/AOG/next flight, "priority" if high priority, else "general". Today is ${new Date().toISOString().slice(0, 10)}.`;

const MINIMAL_INSTRUCTIONS = `Extract shipment fields from the message.`;

const VARIANTS: Variant[] = [
  { name: "primary (Haiku 4.5, full instructions)", instructions: BASE_INSTRUCTIONS, model: anthropic("claude-haiku-4-5") },
  { name: "minimal instructions (Haiku 4.5)", instructions: MINIMAL_INSTRUCTIONS, model: anthropic("claude-haiku-4-5") },
  { name: "gpt-5-mini (full instructions)", instructions: BASE_INSTRUCTIONS, model: openai("gpt-5-mini") as MastraModelConfig },
  { name: "gemini-2.5-flash (full instructions)", instructions: BASE_INSTRUCTIONS, model: google("gemini-2.5-flash") as MastraModelConfig },
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

  const results = [] as { id: string; ok: boolean; latency: number; per_field: Record<string, boolean>; error?: string }[];

  for (const item of items) {
    const t0 = Date.now();
    try {
      const r = await agent.generate([{ role: "user", content: item.input }], { structuredOutput: { schema: RawExtraction } });
      const obj = r.object as z.infer<typeof RawExtraction>;
      const origin = normalizeAirport(obj.origin_text);
      const dest = normalizeAirport(obj.destination_text);
      const e = item.expected;

      const per_field = {
        origin_iata: origin === e.origin_iata,
        destination_iata: dest === e.destination_iata,
        pieces: obj.pieces === e.pieces,
        gross_weight_kg: obj.gross_weight_kg !== null && Math.abs(obj.gross_weight_kg - e.gross_weight_kg) <= Math.max(e.gross_weight_kg * 0.05, 1),
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
  const dataset = JSON.parse(readFileSync(join(process.cwd(), "evals", "dataset.json"), "utf-8")) as { items: Item[] };
  const sample = dataset.items.slice(0, 15);
  console.log(`Running ${VARIANTS.length} variants on ${sample.length} items each...`);

  const allResults: Record<string, Awaited<ReturnType<typeof runVariant>>> = {};

  for (const v of VARIANTS) {
    console.log(`\n--- Variant: ${v.name} ---`);
    const r = await runVariant(v, sample);
    const acc = r.filter((x) => x.ok).length;
    const meanLatency = r.reduce((a, b) => a + b.latency, 0) / r.length;
    console.log(`Accuracy: ${acc}/${r.length} (${((acc / r.length) * 100).toFixed(1)}%). Mean latency: ${Math.round(meanLatency)}ms`);
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
    lines.push(`| ${v.name} | ${acc}/${r.length} (${((acc / r.length) * 100).toFixed(1)}%) | ${Math.round(mean)}ms |`);
  }

  lines.push("");
  lines.push(`## Per-field accuracy across variants`);
  lines.push("");
  const fields = ["origin_iata", "destination_iata", "pieces", "gross_weight_kg", "commodity_type", "service_level"];
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
