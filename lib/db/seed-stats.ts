// Counts what lib/db/seed.ts actually seeds, so the numbers in the README can be
// checked without a database. Reads seed.ts as text because seed.ts opens a
// Postgres connection at import time.
//
//   npm run stats:seed

import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(process.cwd(), "lib", "db", "seed.ts"), "utf-8");

function slice(from: string, to: string): string {
  const start = src.indexOf(from);
  const end = src.indexOf(to);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Could not locate the block between "${from}" and "${to}".`);
  }
  return src.slice(start, end);
}

const airports = [...slice("const AIRPORTS = [", "const COMMON_DG").matchAll(/iata: "(\w+)"/g)].map(
  (m) => m[1],
);

const airlines = [...slice("const AIRLINES = [", "type LaneSeed").matchAll(/\{ iata: "(\w+)"/g)].map(
  (m) => m[1],
);

const lanes = [
  ...slice("const LANES: LaneSeed[] = [", "type RateSpec").matchAll(
    /airline_iata: "(\w+)", origin_iata: "(\w+)", destination_iata: "(\w+)"/g,
  ),
].map((m) => ({ airline: m[1], origin: m[2], destination: m[3] }));

const pairs = new Set(lanes.map((l) => `${l.origin}-${l.destination}`));
const endpoints = new Set(lanes.flatMap((l) => [l.origin, l.destination]));
const unused = airports.filter((a) => !endpoints.has(a));

console.log(`airlines:               ${airlines.length}`);
console.log(`airports seeded:        ${airports.length}`);
console.log(`lanes:                  ${lanes.length}`);
console.log(`origin/destination pairs: ${pairs.size}`);
console.log(`airports used as a lane endpoint: ${endpoints.size}`);
console.log(`airports seeded but unused:       ${unused.length} (${unused.join(", ")})`);
