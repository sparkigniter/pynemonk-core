import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the monolith .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'pynemonk_core',
    password: process.env.PGPASSWORD || 'password',
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
});

async function clearTransactionData() {
    console.log('🚀 Starting deep clean of transaction and fee data...');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // 1. Clear Accounting Transactions
        console.log('📊 Clearing Accounting Ledger, Invoices and Partners...');
        await client.query('TRUNCATE accounting.journal_item CASCADE');
        await client.query('TRUNCATE accounting.journal_entry CASCADE');
        await client.query('TRUNCATE accounting.invoice CASCADE');
        await client.query('TRUNCATE accounting.partner CASCADE');
        await client.query('TRUNCATE accounting.fee_payment_allocation CASCADE');
        await client.query('TRUNCATE accounting.fee_payment CASCADE');
        await client.query('TRUNCATE accounting.fee_invoice CASCADE');
        await client.query('TRUNCATE accounting.bill_payment_allocation CASCADE');
        await client.query('TRUNCATE accounting.bill_payment CASCADE');
        await client.query('TRUNCATE accounting.vendor_bill CASCADE');
        await client.query('TRUNCATE accounting.bank_transaction CASCADE');

        // 2. Clear School Fee Data
        console.log('💰 Clearing Fee Allocations and Installments...');
        await client.query('TRUNCATE school.fee_installment CASCADE');
        await client.query('TRUNCATE school.student_fee_discount CASCADE');
        await client.query('TRUNCATE school.student_fee_allocation CASCADE');

        // 3. Clear Academic Transactions (Optional but helpful for clean state)
        console.log('📝 Clearing Attendance and Exam Records...');
        await client.query('TRUNCATE school.attendance CASCADE');
        
        // Check if exam tables exist before truncating
        const examTables = ['exam_marks', 'exam_student', 'exam_paper', 'exam_invitation', 'exam'];
        for (const table of examTables) {
            try {
                await client.query(`TRUNCATE school.${table} CASCADE`);
            } catch (e) {
                // Ignore if table doesn't exist
            }
        }

        await client.query('COMMIT');
        console.log('✅ Success! All fee and accounting transaction data has been cleared.');
        console.log('💡 Note: Configuration data (Fee Heads, Structures, COA) remains intact.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to clear data:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

clearTransactionData();
