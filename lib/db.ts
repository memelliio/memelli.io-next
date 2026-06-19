import { Pool } from 'pg';

// One pooled connection to the single database (control_store).
// Reuse across hot-reloads / serverless invocations.
const g = globalThis as unknown as { __pgpool?: Pool };

export const pool: Pool =
  g.__pgpool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    max: 5,
  });

if (!g.__pgpool) g.__pgpool = pool;

// All app tables live in the control_store schema.
export const SCHEMA = 'control_store';

export async function q<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
