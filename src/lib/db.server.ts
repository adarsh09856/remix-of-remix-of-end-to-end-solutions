// Server-only PostgreSQL Connection Pool
// Points directly to the local aaPanel PostgreSQL database
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || "takinmart"}:${process.env.POSTGRES_PASSWORD || "takinmart"}@${process.env.POSTGRES_HOST || "127.0.0.1"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB || "takinmart"}`;

let pool: any = null;

export async function getDbPool() {
  if (!pool) {
    try {
      const pgModule = await import("pg");
      const PoolClass = pgModule.default?.Pool || (pgModule as any).Pool;
      if (!PoolClass) return null;
      pool = new PoolClass({
        connectionString: DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      pool.on("error", (err: any) => {
        console.warn("[PostgreSQL TakinMart] Unexpected pool error:", err.message);
      });
    } catch {
      return null;
    }
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  try {
    const p = await getDbPool();
    if (!p) return [];
    const result = await p.query(text, params);
    return (result?.rows || []) as T[];
  } catch (err: any) {
    console.warn(`[PostgreSQL TakinMart Notice]: ${err.message}`);
    return [];
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
