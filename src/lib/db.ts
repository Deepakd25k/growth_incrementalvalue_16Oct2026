import "server-only";
import postgres from "postgres";
import { SCHEMA_SQL } from "./schema";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __sql?: Sql; __schema?: Promise<void> };

export function hasDb() {
  return Boolean(process.env.DATABASE_URL);
}

function client(): Sql {
  if (!globalForDb.__sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
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
