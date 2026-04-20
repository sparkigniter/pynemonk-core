import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Production-ready Migration Runner.
 * Tracks applied migrations in the database to ensure exactly-once execution.
 */
export async function runMigrations(pool: Pool): Promise<void> {
    const client = await pool.connect();
    try {
        console.log("[MigrationRunner] Checking for pending migrations...");

        // 1. Ensure the migrations tracking table exists
        await client.query(`
            CREATE SCHEMA IF NOT EXISTS school;
            CREATE TABLE IF NOT EXISTS school.migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 2. Identify migration files
        const possibleDirs = [
            path.join(process.cwd(), "sql/migrations"),
            path.join(process.cwd(), "services/pynemonk-core-school/sql/migrations"),
            path.join(__dirname, "../../sql/migrations"),
            path.join(__dirname, "../sql/migrations"),
        ];

        let activeDir = "";
        for (const dir of possibleDirs) {
            if (fs.existsSync(dir)) {
                activeDir = dir;
                break;
            }
        }

        if (!activeDir) {
            console.warn("[MigrationRunner] No migrations directory found. Checked:", possibleDirs);
            return;
        }

        console.log(`[MigrationRunner] Using migrations from: ${activeDir}`);

        const files = fs
            .readdirSync(activeDir)
            .filter((f) => f.endsWith(".sql"))
            .sort(); // Ensure 001 runs before 002

        // 3. Apply pending migrations
        for (const file of files) {
            const { rows } = await client.query(
                "SELECT id FROM school.migrations WHERE name = $1",
                [file],
            );

            if (rows.length === 0) {
                console.log(`[MigrationRunner] Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(activeDir, file), "utf8");

                await client.query("BEGIN");
                try {
                    await client.query(sql);
                    await client.query("INSERT INTO school.migrations (name) VALUES ($1)", [file]);
                    await client.query("COMMIT");
                    console.log(`[MigrationRunner] Successfully applied ${file}`);
                } catch (err: any) {
                    await client.query("ROLLBACK");
                    console.error(`[MigrationRunner] FAILED to apply ${file}:`, err.message);
                    throw err; // Stop the sequence on failure
                }
            }
        }

        console.log("[MigrationRunner] All migrations are up to date.");
    } catch (error: any) {
        console.error("[MigrationRunner] Fatal migration error:", error.message);
    } finally {
        client.release();
    }
}
