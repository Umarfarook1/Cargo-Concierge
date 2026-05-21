import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DBType = PostgresJsDatabase<typeof schema>;

let cached: DBType | null = null;

export function getDb(): DBType {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(connectionString, { prepare: false, max: 5 });
  cached = drizzle(client, { schema });
  return cached;
}

export const db = new Proxy({} as DBType, {
  get(_target, prop) {
    const d = getDb() as unknown as Record<string | symbol, unknown>;
    const v = d[prop];
    return typeof v === "function" ? v.bind(d) : v;
  },
});

export type DB = DBType;
