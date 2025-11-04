import fs from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

export async function runMigrations(options?: { dir?: string }) {
  const dir = options?.dir ?? path.resolve(process.cwd(), "migrations");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Skipping migrations.");
    return { applied: [] as string[], skipped: true };
  }

  const pool = new Pool({ connectionString: url });
  const applied: string[] = [];

  try {
    const entries = await fs.readdir(dir);
    const files = entries
      .filter((f) => f.toLowerCase().endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const full = path.join(dir, file);
      const sql = await fs.readFile(full, "utf8");
      if (!sql.trim()) continue;
      console.log(`\n>> Applying migration: ${file}`);
      try {
        await pool.query(sql);
        applied.push(file);
        console.log(`✓ Applied ${file}`);
      } catch (err: any) {
        console.error(`✗ Failed ${file}:`, err?.message ?? err);
        throw err;
      }
    }
  } finally {
    await pool.end();
  }

  return { applied, skipped: false };
}

// Run directly from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().then((result) => {
    if (result.skipped) process.exit(0);
    console.log(`\nMigrations complete. Applied: ${result.applied.length}`);
  }).catch((err) => {
    console.error("Migration run failed:", err);
    process.exit(1);
  });
}
