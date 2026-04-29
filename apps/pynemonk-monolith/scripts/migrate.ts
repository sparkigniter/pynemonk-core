import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import directly from the DB utilities to avoid loading the entire service (routers/controllers)
// This bypasses the decorator issues in the API layer during migrations.
import { pool as authPool, runMigrations as runAuthMigrations } from "pynemonk-core-auth/module";
import { pool as schoolPool, runMigrations as runSchoolMigrations } from "pynemonk-core-school/module";
import { pool as accountingPool, runMigrations as runAccountingMigrations } from "pynemonk-core-accounting/module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function migrate() {
    console.log("🚀 Starting platform-wide migrations...");

    try {
        console.log("\n[1/3] Running Auth Migrations...");
        await runAuthMigrations(authPool);

        console.log("\n[2/3] Running School Migrations...");
        await runSchoolMigrations(schoolPool);

        console.log("\n[3/3] Running Accounting Migrations...");
        await runAccountingMigrations(accountingPool);

        console.log("\n✅ All migrations completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed!");
        console.error(error);
        process.exit(1);
    }
}

migrate();
