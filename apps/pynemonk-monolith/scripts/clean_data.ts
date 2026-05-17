import "reflect-metadata";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool as accountingPool } from "pynemonk-core-accounting/module";
import { pool as schoolPool } from "pynemonk-core-school/module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function clean() {
    console.log("🧹 Starting data cleanup...");

    try {
        const client = await accountingPool.connect();
        try {
            await client.query('BEGIN');
            
            console.log("- Cleaning Accounting Transactions...");
            await client.query('TRUNCATE accounting.bill_payment_allocation CASCADE');
            await client.query('TRUNCATE accounting.bill_payment CASCADE');
            await client.query('TRUNCATE accounting.vendor_bill CASCADE');
            await client.query('TRUNCATE accounting.fee_payment CASCADE');
            await client.query('TRUNCATE accounting.invoice CASCADE');
            await client.query('TRUNCATE accounting.fee_invoice CASCADE');
            await client.query('TRUNCATE accounting.journal_item CASCADE');
            await client.query('TRUNCATE accounting.journal_entry CASCADE');
            await client.query('TRUNCATE accounting.staff_salary CASCADE');
            
            console.log("- Cleaning Student Fee Allocations...");
            // schoolPool might be different or the same connection string, 
            // but we can run cross-schema queries if the user has permissions.
            await client.query('TRUNCATE school.fee_installment CASCADE');
            await client.query('TRUNCATE school.student_fee_allocation CASCADE');
            await client.query('TRUNCATE school.student_fee_discount CASCADE');
            
            console.log("- Resetting Accounting Partners...");
            await client.query('DELETE FROM accounting.partner WHERE external_ref_type IS NOT NULL');

            await client.query('COMMIT');
            console.log("\n✅ Cleanup completed successfully!");
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Cleanup failed!");
        console.error(error);
        process.exit(1);
    }
}

clean();
