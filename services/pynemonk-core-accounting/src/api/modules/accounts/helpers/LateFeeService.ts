import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import JournalHelper from "./JournalHelper.js";
import SystemMappingHelper from "./SystemMappingHelper.js";

@injectable()
export default class LateFeeService {
    constructor(
        @inject("DB") private db: Pool,
        @inject(JournalHelper) private journalHelper: JournalHelper,
        @inject(SystemMappingHelper) private systemMapping: SystemMappingHelper
    ) {}

    /**
     * Scans for unpaid invoices that are past their due date + grace period
     * and applies late fees based on the policy.
     */
    public async processLateFees(tenantId: number, userId: number): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Find all unpaid/partially paid invoices that have a late fee policy linked to their installment
            const overdueInvoices = await client.query(`
                SELECT 
                    i.id, i.net_amount, i.due_amount, i.due_date, i.total_late_fee_applied, i.last_late_fee_applied_at,
                    p.id as policy_id, p.fee_type, p.amount as policy_amount, p.grace_period_days, p.frequency,
                    inst.name as installment_name
                FROM accounting.fee_invoice i
                JOIN accounting.fee_installment inst ON i.installment_id = inst.id
                JOIN accounting.late_fee_policy p ON inst.late_fee_policy_id = p.id
                WHERE i.tenant_id = $1 
                  AND i.status IN ('unpaid', 'partially_paid')
                  AND i.due_date + (p.grace_period_days * INTERVAL '1 day') < CURRENT_DATE
                  AND p.is_active = TRUE
            `, [tenantId]);

            let appliedCount = 0;
            let totalRevenue = 0;

            for (const inv of overdueInvoices.rows) {
                let feeToApply = 0;
                const lastApplied = inv.last_late_fee_applied_at ? new Date(inv.last_late_fee_applied_at) : null;
                const today = new Date();
                
                // Frequency Logic
                if (inv.frequency === 'one-time' && inv.total_late_fee_applied > 0) continue;
                
                if (inv.frequency === 'daily') {
                    // Calculate days since last application or since due date+grace
                    const startDate = lastApplied || new Date(new Date(inv.due_date).getTime() + (inv.grace_period_days * 24 * 60 * 60 * 1000));
                    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
                    
                    if (daysDiff <= 0 && lastApplied) continue; 
                    const multiplier = lastApplied ? daysDiff : daysDiff + 1;
                    if (multiplier <= 0) continue;

                    if (inv.fee_type === 'fixed') {
                        feeToApply = inv.policy_amount * multiplier;
                    } else {
                        feeToApply = (inv.net_amount * (inv.policy_amount / 100)) * multiplier;
                    }
                } else if (inv.frequency === 'one-time') {
                    if (inv.fee_type === 'fixed') {
                        feeToApply = inv.policy_amount;
                    } else {
                        feeToApply = inv.net_amount * (inv.policy_amount / 100);
                    }
                }

                if (feeToApply > 0) {
                    // 2. Update Invoice
                    await client.query(`
                        UPDATE accounting.fee_invoice 
                        SET 
                            net_amount = net_amount + $1,
                            due_amount = due_amount + $1,
                            total_late_fee_applied = total_late_fee_applied + $1,
                            last_late_fee_applied_at = NOW(),
                            updated_at = NOW()
                        WHERE id = $2
                    `, [feeToApply, inv.id]);

                    // 3. Post to General Ledger
                    const lateFeeIncomeAccount = await this.systemMapping.getMappedAccount(tenantId, 'LATE_FEE_INCOME');
                    const accountsReceivableAccount = await this.systemMapping.getMappedAccount(tenantId, 'ACCOUNTS_RECEIVABLE');

                    if (lateFeeIncomeAccount && accountsReceivableAccount) {
                        await this.journalHelper.createEntry(tenantId, userId, {
                            entry_date: today,
                            reference_no: `LATE-FEE/INV-${inv.id}`,
                            description: `Automated Late Fee for ${inv.installment_name}`,
                            items: [
                                { account_id: accountsReceivableAccount, debit: feeToApply, credit: 0 },
                                { account_id: lateFeeIncomeAccount, debit: 0, credit: feeToApply }
                            ]
                        });
                    }

                    appliedCount++;
                    totalRevenue += feeToApply;
                }
            }

            await client.query('COMMIT');
            return { success: true, appliedCount, totalRevenue };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    public async getPolicies(tenantId: number) {
        const res = await this.db.query('SELECT * FROM accounting.late_fee_policy WHERE tenant_id = $1 AND is_active = TRUE', [tenantId]);
        return res.rows;
    }

    public async createPolicy(tenantId: number, data: any) {
        const res = await this.db.query(`
            INSERT INTO accounting.late_fee_policy (tenant_id, name, fee_type, amount, grace_period_days, frequency)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
        `, [tenantId, data.name, data.fee_type, data.amount, data.grace_period_days, data.frequency]);
        return res.rows[0];
    }
}
