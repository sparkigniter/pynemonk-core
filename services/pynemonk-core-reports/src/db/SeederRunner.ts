import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Standardized Seeder Runner for reports service.
 * Executes SQL seeders from the sql/seeders directory.
 */
export async function runSeeders(pool: Pool): Promise<void> {
    const client = await pool.connect();
    try {
        console.log("[SeederRunner:reports] Checking for seeders...");

        const possibleDirs = [
            path.join(process.cwd(), "services/pynemonk-core-reports/sql/seeders"),
            path.join(process.cwd(), "../../services/pynemonk-core-reports/sql/seeders"),
            path.join(process.cwd(), "sql/seeders"),
            path.join(__dirname, "../../sql/seeders"),
            path.join(__dirname, "../sql/seeders"),
        ];

        let activeDir = "";
        for (const dir of possibleDirs) {
            if (fs.existsSync(dir)) {
                activeDir = dir;
                break;
            }
        }

        if (!activeDir) {
            console.warn("[SeederRunner:reports] No seeders directory found. Checked:", possibleDirs);
            return;
        }

        console.log(`[SeederRunner:reports] Using seeders from: ${activeDir}`);

        const files = fs
            .readdirSync(activeDir)
            .filter((f) => f.endsWith(".sql"))
            .sort();

        for (const file of files) {
            console.log(`[SeederRunner:reports] Executing seeder: ${file}`);
            const sql = fs.readFileSync(path.join(activeDir, file), "utf8");

            await client.query("BEGIN");
            try {
                await client.query(sql);
                await client.query("COMMIT");
                console.log(`[SeederRunner:reports] Successfully executed ${file}`);
            } catch (err: any) {
                await client.query("ROLLBACK");
                console.error(`[SeederRunner:reports] FAILED to execute ${file}:`, err.message);
                throw err;
            }
        }

        console.log("[SeederRunner:reports] All seeders executed successfully.");
    } catch (error: any) {
        console.error("[SeederRunner:reports] Fatal seeder error:", error.message);
        throw error;
    } finally {
        client.release();
    }
}
