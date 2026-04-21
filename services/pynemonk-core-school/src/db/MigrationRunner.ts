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
        console.log("[MigrationRunner:school] Checking for pending migrations...");

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
            // Local to the service (when running from service root)
            path.join(process.cwd(), "sql/migrations"),
            // From monorepo root
            path.join(process.cwd(), "services/pynemonk-core-school/sql/migrations"),
            // From apps/pynemonk-monolith root
            path.join(process.cwd(), "../../services/pynemonk-core-school/sql/migrations"),
            // Relative to this file (works for both src/ and dist/ if sql is copied)
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
            console.warn("[MigrationRunner:school] No migrations directory found. Checked:", possibleDirs);
            return;
        }

        console.log(`[MigrationRunner:school] CWD: ${process.cwd()}`);
        console.log(`[MigrationRunner:school] Dirname: ${__dirname}`);
        console.log(`[MigrationRunner:school] Using migrations from: ${activeDir}`);

        const files = fs
            .readdirSync(activeDir)
            .filter((f) => f.endsWith(".sql"))
            .sort();

        console.log(`[MigrationRunner:school] Found ${files.length} migration files: ${files.join(", ")}`);

        // 3. Apply pending migrations
        for (const file of files) {
            const { rows } = await client.query(
                "SELECT id FROM school.migrations WHERE name = $1",
                [file],
            );

            if (rows.length === 0) {
                console.log(`[MigrationRunner:school] Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(activeDir, file), "utf8");

                await client.query("BEGIN");
                try {
                    await client.query(sql);
                    await client.query("INSERT INTO school.migrations (name) VALUES ($1)", [file]);
                    await client.query("COMMIT");
                    console.log(`[MigrationRunner:school] Successfully applied ${file}`);
                } catch (err: any) {
                    await client.query("ROLLBACK");
                    console.error(`[MigrationRunner:school] FAILED to apply ${file}:`, err.message);
                    throw err; // Stop the sequence on failure
                }
            }
        }

        console.log("[MigrationRunner:school] All migrations are up to date.");
    } catch (error: any) {
        console.error("[MigrationRunner:school] Fatal migration error:", error.message);
        throw error; // Re-throw to prevent monolith from starting with broken schema
    } finally {
        client.release();
    }
}
