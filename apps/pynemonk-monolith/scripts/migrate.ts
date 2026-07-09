import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import directly from the DB utilities to avoid loading the entire service (routers/controllers)
// This bypasses the decorator issues in the API layer during migrations.
import { pool as authPool, runMigrations as runAuthMigrations } from "pynemonk-core-auth/module";
import { pool as schoolPool, runMigrations as runSchoolMigrations } from "pynemonk-core-school/module";
import { pool as accountingPool, runMigrations as runAccountingMigrations } from "pynemonk-core-accounting/module";
import { pool as reportsPool, runMigrations as runReportsMigrations } from "pynemonk-core-reports/module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function migrate() {
    console.log("🚀 Starting platform-wide migrations...");

    try {
        console.log("\n[1/4] Running Auth Migrations...");
        await runAuthMigrations(authPool);

        console.log("\n[2/4] Running School Migrations...");
        await runSchoolMigrations(schoolPool);

        console.log("\n[3/4] Running Accounting Migrations...");
        await runAccountingMigrations(accountingPool);

        console.log("\n[4/4] Running Reports Migrations...");
        await runReportsMigrations(reportsPool);

        console.log("\n✅ All migrations completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Migration failed!");
        console.error(error);
        process.exit(1);
    }
}

migrate();
