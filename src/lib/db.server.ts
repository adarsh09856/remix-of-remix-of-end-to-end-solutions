import pg from "pg";
const { Pool } = pg;

// Server-only PostgreSQL Connection Pool
// Points directly to the local aaPanel PostgreSQL database
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || "takinmart"}:${process.env.POSTGRES_PASSWORD || "takinmart"}@${process.env.POSTGRES_HOST || "127.0.0.1"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "takinmart"}`;

let pool: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.warn("[PostgreSQL] Unexpected pool client error:", err.message);
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const p = getDbPool();
    const result = await p.query(text, params);
    return result.rows as T[];
  } catch (err: any) {
    console.warn(`[PostgreSQL Query Error]: ${err.message}`);
    throw err;
  }
}

export async function checkDbConnection(): Promise<boolean> {
  try {
    const rows = await query("SELECT 1 as connected");
    return rows.length > 0 && rows[0].connected === 1;
  } catch {
    return false;
  }
}
