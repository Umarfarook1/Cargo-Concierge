import "dotenv/config";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { extractShipment } from "../lib/agents/extraction";

type Expected = {
  origin_iata: string;
  destination_iata: string;
  pieces: number;
  gross_weight_kg: number;
  commodity_type: string;
  service_level: string;
  special_handling: string[];
};

type Item = {
  id: string;
  input: string;
  expected: Expected;
};

type Dataset = {
  version: number;
  description: string;
  items: Item[];
};

type FieldResult = {
  field: string;
  correct: number;
  total: number;
};

type RunResult = {
  id: string;
  latency_ms: number;
  ok: boolean;
  error?: string;
  per_field: Record<string, boolean>;
};

const numEqualWithTolerance = (a: number, b: number, pct: number) => {
  if (a === b) return true;
  const tol = Math.max(Math.abs(b) * pct, 1);
  return Math.abs(a - b) <= tol;
};

const setF1 = (predicted: string[], actual: string[]) => {
  const p = new Set(predicted);
  const a = new Set(actual);
  let tp = 0;
  for (const x of p) if (a.has(x)) tp++;
  const precision = p.size === 0 ? (a.size === 0 ? 1 : 0) : tp / p.size;
  const recall = a.size === 0 ? (p.size === 0 ? 1 : 0) : tp / a.size;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { precision, recall, f1, exact: p.size === a.size && [...p].every((x) => a.has(x)) };
};

async function runOne(item: Item): Promise<RunResult> {
  const t0 = Date.now();
  try {
    const { request } = await extractShipment(item.input);
    const latency = Date.now() - t0;
    const e = item.expected;
    const handlingF1 = setF1(request.special_handling, e.special_handling);

    const per_field = {
      origin_iata: request.origin_iata === e.origin_iata,
      destination_iata: request.destination_iata === e.destination_iata,
      pieces: request.pieces === e.pieces,
      gross_weight_kg: numEqualWithTolerance(request.gross_weight_kg, e.gross_weight_kg, 0.05),
      commodity_type: request.commodity_type === e.commodity_type,
      service_level: request.service_level === e.service_level,
      special_handling_exact: handlingF1.exact,
    };

    return {
      id: item.id,
      latency_ms: latency,
      ok: Object.values(per_field).every(Boolean),
      per_field,
    };
  } catch (err) {
    return {
      id: item.id,
      latency_ms: Date.now() - t0,
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
      per_field: {},
    };
  }
}

function summarize(results: RunResult[]) {
  const fields = ["origin_iata", "destination_iata", "pieces", "gross_weight_kg", "commodity_type", "service_level", "special_handling_exact"];
  const field_metrics: FieldResult[] = fields.map((field) => ({
    field,
    correct: results.filter((r) => r.per_field[field]).length,
    total: results.filter((r) => Object.keys(r.per_field).length > 0).length,
  }));

  const latencies = results.map((r) => r.latency_ms).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? latencies[latencies.length - 1];
  const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const total_correct = results.filter((r) => r.ok).length;
  const total = results.length;
  const errors = results.filter((r) => r.error).map((r) => `${r.id}: ${r.error}`);

  return { field_metrics, total_correct, total, latencies: { p50, p95, mean }, errors };
}

function renderMarkdown(summary: ReturnType<typeof summarize>) {
  const { field_metrics, total_correct, total, latencies, errors } = summary;
  const lines: string[] = [];
  lines.push(`# Extraction eval results`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Overall accuracy: ${total_correct}/${total} (${((total_correct / total) * 100).toFixed(1)}%)**`);
  lines.push("");
  lines.push(`Latency: p50 ${latencies.p50}ms, p95 ${latencies.p95}ms, mean ${Math.round(latencies.mean)}ms`);
  lines.push("");
  lines.push(`## Per-field accuracy`);
  lines.push("");
  lines.push("| Field | Correct | Total | Accuracy |");
  lines.push("|---|---|---|---|");
  for (const f of field_metrics) {
    const pct = f.total === 0 ? 0 : (f.correct / f.total) * 100;
    lines.push(`| ${f.field} | ${f.correct} | ${f.total} | ${pct.toFixed(1)}% |`);
  }
  if (errors.length > 0) {
    lines.push("");
    lines.push(`## Errors`);
    lines.push("");
    for (const e of errors) lines.push(`- ${e}`);
  }
  return lines.join("\n");
}

async function main() {
  const datasetPath = join(process.cwd(), "evals", "dataset.json");
  const dataset = JSON.parse(readFileSync(datasetPath, "utf-8")) as Dataset;
  console.log(`Running ${dataset.items.length} items...`);

  const results: RunResult[] = [];
  for (let i = 0; i < dataset.items.length; i++) {
    const item = dataset.items[i];
    process.stdout.write(`  [${i + 1}/${dataset.items.length}] ${item.id}... `);
    const r = await runOne(item);
    console.log(r.ok ? "ok" : `FAIL${r.error ? " (" + r.error + ")" : ""}`);
    results.push(r);
  }

  const summary = summarize(results);
  const md = renderMarkdown(summary);

  const outDir = join(process.cwd(), "evals", "results");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "extraction.md"), md);
  writeFileSync(join(outDir, "extraction.json"), JSON.stringify({ summary, results }, null, 2));

  console.log("\n" + md);
  console.log("\nResults saved to evals/results/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
