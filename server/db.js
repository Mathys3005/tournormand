import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant : colle l'URL de connexion Neon dans les variables d'environnement.");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(url);
export const pool = new pg.Pool({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
  max: 5,
});

const DEFAULT_WHITELIST = ["nanolepa", "mathys27", "pierre27"];

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS whitelist (
      pseudo     text PRIMARY KEY,
      pin_hash   text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token      text PRIMARY KEY,
      pseudo     text NOT NULL REFERENCES whitelist(pseudo) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS games (
      id         text PRIMARY KEY,
      status     text NOT NULL,
      state      jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  const seed = (process.env.WHITELIST || DEFAULT_WHITELIST.join(","))
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const p of seed) {
    await pool.query("INSERT INTO whitelist (pseudo) VALUES ($1) ON CONFLICT DO NOTHING", [p]);
  }
}
