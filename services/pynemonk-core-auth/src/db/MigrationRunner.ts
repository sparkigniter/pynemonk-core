import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * A simple utility to execute migrate.sql on startup.
 * Ensures the schema is always in sync with the code.
 */
export async function runMigrations(pool: Pool): Promise<void> {
    try {
        // Find migrate.sql (tries a few common locations based on dev vs prod)
        const possiblePaths = [
            // Relative to the compiled JS in dist/
            path.join(__dirname, "../../sql/migrate.sql"),
            path.join(__dirname, "../sql/migrate.sql"),
            // Relative to project root (Docker /app or local repo)
            path.join(process.cwd(), "services/pynemonk-core-auth/sql/migrate.sql"),
            path.join(process.cwd(), "sql/migrate.sql"),
        ];

        let migrationSql = "";
        let foundPath = "";

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                migrationSql = fs.readFileSync(p, "utf8");
                foundPath = p;
                break;
            }
        }

        if (!migrationSql) {
            console.warn("[MigrationRunner] migrate.sql not found. Skipping auto-migrations.");
            return;
        }

        console.log(`[MigrationRunner] Applying migrations from ${foundPath}...`);

        // Execute the entire SQL script in a transaction
        await pool.query("BEGIN");
        await pool.query(migrationSql);
        await pool.query("COMMIT");

        console.log("[MigrationRunner] Migrations applied successfully.");
    } catch (error: any) {
        await pool.query("ROLLBACK").catch((error: any) => { });
        console.error("[MigrationRunner] FAILED to apply migrations:", error.message);
    }
}
