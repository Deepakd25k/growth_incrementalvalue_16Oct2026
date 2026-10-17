import "server-only";
import postgres from "postgres";
import { SCHEMA_SQL } from "./schema";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __sql?: Sql; __schema?: Promise<void> };

// Vercel's Neon integration sets DATABASE_URL; older Vercel Postgres setups use POSTGRES_URL.
function rawUrl() {
  return (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim().replace(/^['"]|['"]$/g, "");
}

export function hasDb() {
  return Boolean(rawUrl());
}

// Neon URLs carry libpq-only options (e.g. channel_binding=require). postgres.js would forward
// them to the server as settings and every query would fail, so drop them here.
function connectionUrl(): string {
  const url = new URL(rawUrl());
  for (const key of ["channel_binding", "options", "connect_timeout"]) url.searchParams.delete(key);
  return url.toString();
}

function client(): Sql {
  if (!globalForDb.__sql) {
    if (!hasDb()) throw new Error("DATABASE_URL is not set");
    const url = connectionUrl();
    // prepare:false keeps it compatible with pooled (pgbouncer) URLs from Neon/Supabase.
    globalForDb.__sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10 });
  }
  return globalForDb.__sql;
}

// Creates tables on first use per server instance, so a fresh database works without a manual step.
export async function db(): Promise<Sql> {
  const sql = client();
  if (!globalForDb.__schema) {
    globalForDb.__schema = sql.unsafe(SCHEMA_SQL).then(() => undefined);
    globalForDb.__schema.catch(() => {
      globalForDb.__schema = undefined;
    });
  }
  await globalForDb.__schema;
  return sql;
}
