import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import from the modules
import { pool as authPool } from "pynemonk-core-auth/module";
import { pool as schoolPool } from "pynemonk-core-school/module";
import { pool as accountingPool, runSeeders as runAccountingSeeders } from "pynemonk-core-accounting/module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function seed() {
    console.log("🌱 Starting platform-wide seeding...");

    try {
        // Auth and School might need seeders too, but for now we focus on Accounting as requested.
        
        console.log("\n[1/1] Running Accounting Seeders...");
        await runAccountingSeeders(accountingPool);

        console.log("\n✅ All seeding completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed!");
        console.error(error);
        process.exit(1);
    }
}

seed();
