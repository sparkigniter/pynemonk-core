import "reflect-metadata";
import { container } from "tsyringe";
import pool from "../db/pg-pool.js";
import FeeAutomationService from "../api/modules/fee/services/FeeAutomationService.js";

async function repairLedger() {
    const service = container.resolve(FeeAutomationService);
    console.log("Starting Ledger Repair...");

    try {
        // Find all invoices that exist but don't have a recognition journal entry
        const res = await pool.query(`
            SELECT fi.*, p.name as student_name
            FROM accounting.fee_invoice fi
            JOIN accounting.partner p ON fi.student_id = p.id
            WHERE fi.is_deleted = FALSE
            AND NOT EXISTS (
                SELECT 1 FROM accounting.journal_entry je
                WHERE (je.metadata->>'invoice_id')::int = fi.id
                AND je.transaction_type IN ('fee_admission', 'fee_tuition', 'fee_transport', 'fee_hostel', 'fee_miscellaneous', 'fee_allocation')
            )
        `);

        console.log(`Found ${res.rows.length} unposted invoices.`);

        for (const inv of res.rows) {
            console.log(`Posting invoice #${inv.id} for ${inv.student_name}...`);
            
            // We need to simulate the recognition part of processFeeAssignment or processFeePayment
            const tenantId = inv.tenant_id;
            const userId = 1; // System user

            // This is a bit of a hack to re-run the logic
            // Since we already have the invoice, we just need to post the GL
            // We'll use a simplified version of the logic in FeeAutomationService
            const arAccountRes = await pool.query("SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND code = '1200'", [tenantId]);
            const revAccountRes = await pool.query("SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND code = '4100'", [tenantId]);

            if (arAccountRes.rows.length > 0 && revAccountRes.rows.length > 0) {
                const arAccount = arAccountRes.rows[0].id;
                const revAccount = revAccountRes.rows[0].id;

                await pool.query(`
                    INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, transaction_type, metadata, created_by)
                    VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
                    RETURNING id
                `, [
                    tenantId, 
                    inv.invoice_no || `INV-${inv.id}`, 
                    `Fee Recognition (Repair): ${inv.student_name}`,
                    inv.source_type || 'fee_allocation',
                    JSON.stringify({ invoice_id: inv.id, student_id: inv.student_id }),
                    userId
                ]).then(async (jeRes) => {
                    const jeId = jeRes.rows[0].id;
                    // Debit AR
                    await pool.query(`
                        INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, partner_id, partner_type)
                        VALUES ($1, $2, $3, $4, 0, $5, 'student')
                    `, [tenantId, jeId, arAccount, inv.total_amount, inv.student_id]);
                    
                    // Credit Revenue
                    await pool.query(`
                        INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, partner_id, partner_type)
                        VALUES ($1, $2, $3, 0, $4, $5, 'student')
                    `, [tenantId, jeId, revAccount, inv.total_amount, inv.student_id]);
                });
            }
        }

        console.log("Ledger Repair Complete.");
    } catch (err) {
        console.error("Repair failed:", err);
    } finally {
        process.exit(0);
    }
}

repairLedger();
