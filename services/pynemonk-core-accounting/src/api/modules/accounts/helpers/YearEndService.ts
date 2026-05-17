import { inject, injectable } from "tsyringe";
import { Pool } from "pg";
import JournalHelper from "./JournalHelper.js";
import SystemMappingHelper from "./SystemMappingHelper.js";
import ReportHelper from "./ReportHelper.js";

@injectable()
export default class YearEndService {
    constructor(
        @inject("DB") private db: Pool,
        @inject(JournalHelper) private journalHelper: JournalHelper,
        @inject(SystemMappingHelper) private systemMapping: SystemMappingHelper,
        @inject(ReportHelper) private reportHelper: ReportHelper
    ) {}

    /**
     * Closes a fiscal year by zeroing out Revenue/Expense accounts and moving balance to Retained Earnings.
     */
    public async closeFiscalYear(tenantId: number, userId: number, fiscalYearId: number): Promise<any> {
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');

            // 1. Get fiscal year details
            const fyRes = await client.query(
                `SELECT * FROM accounting.fiscal_year WHERE id = $1 AND tenant_id = $2`,
                [fiscalYearId, tenantId]
            );
            const fy = fyRes.rows[0];

            if (!fy) throw new Error("Fiscal year not found.");
            if (fy.status === 'closed') throw new Error("Fiscal year is already closed.");

            // 2. Get all Revenue and Expense account balances for the period
            const pl = await this.reportHelper.getProfitAndLoss(tenantId, { startDate: fy.start_date, endDate: fy.end_date });
            const netProfit = pl.netProfit;

            // 3. Get Retained Earnings Account
            const retainedEarningsAccountId = await this.systemMapping.getMappedAccount(tenantId, 'RETAINED_EARNINGS');
            if (!retainedEarningsAccountId) {
                throw new Error("Retained Earnings account is not mapped. Please configure it in Accounting Settings.");
            }

            // 4. Create Closing Journal Entry
            // We need to:
            // - Debit Revenue accounts (to zero them out)
            // - Credit Expense accounts (to zero them out)
            // - Post the difference to Retained Earnings
            const journalItems: any[] = [];

            // Zero out Revenue (Revenue normally has Credit balance, so we Debit it)
            for (const item of pl.revenue) {
                if (parseFloat(item.balance) !== 0) {
                    journalItems.push({
                        account_id: item.id || (await this.getAccountIdByCode(tenantId, item.code)),
                        debit: parseFloat(item.balance),
                        credit: 0,
                        description: `Closing ${item.account_name} for ${fy.name}`
                    });
                }
            }

            // Zero out Expenses (Expense normally has Debit balance, so we Credit it)
            for (const item of pl.expenses) {
                const balance = Math.abs(parseFloat(item.balance));
                if (balance !== 0) {
                    journalItems.push({
                        account_id: item.id || (await this.getAccountIdByCode(tenantId, item.code)),
                        debit: 0,
                        credit: balance,
                        description: `Closing ${item.account_name} for ${fy.name}`
                    });
                }
            }

            // Post Net Profit/Loss to Retained Earnings
            // If Profit > 0 (Credit Retained Earnings)
            // If Profit < 0 (Debit Retained Earnings)
            if (netProfit > 0) {
                journalItems.push({
                    account_id: retainedEarningsAccountId,
                    debit: 0,
                    credit: netProfit,
                    description: `Transferring Net Profit to Retained Earnings for ${fy.name}`
                });
            } else if (netProfit < 0) {
                journalItems.push({
                    account_id: retainedEarningsAccountId,
                    debit: Math.abs(netProfit),
                    credit: 0,
                    description: `Transferring Net Loss to Retained Earnings for ${fy.name}`
                });
            }

            if (journalItems.length > 0) {
                await this.journalHelper.createEntry(tenantId, userId, {
                    entry_date: fy.end_date,
                    reference_no: `CLOSING/${fy.name}`,
                    description: `Year-End Closing Entry for ${fy.name}`,
                    items: journalItems
                });
            }

            // 5. Update Fiscal Year Status
            await client.query(
                `UPDATE accounting.fiscal_year SET status = 'closed', updated_at = NOW() WHERE id = $1`,
                [fiscalYearId]
            );

            await client.query('COMMIT');
            return { success: true, netProfit, message: `Fiscal year ${fy.name} closed successfully.` };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private async getAccountIdByCode(tenantId: number, code: string): Promise<number> {
        const res = await this.db.query(
            `SELECT id FROM accounting.chart_of_accounts WHERE tenant_id = $1 AND code = $2`,
            [tenantId, code]
        );
        return res.rows[0]?.id;
    }
}
