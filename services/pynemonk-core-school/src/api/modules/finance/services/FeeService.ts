import { injectable, inject } from 'tsyringe';
import { Pool } from 'pg';
import { Logger } from '../../../core/utils/Logger.js';

@injectable()
export class FeeService {
    constructor(@inject('DB') private pool: Pool) {}

    /**
     * Define a new Fee Head (e.g. Tuition Fee)
     */
    async createFeeHead(tenantId: number, data: any) {
        const query = `
            INSERT INTO school.fee_head (tenant_id, name, code, is_refundable)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const res = await this.pool.query(query, [tenantId, data.name, data.code, data.is_refundable]);
        return res.rows[0];
    }

    /**
     * Create a Fee Structure (The Template)
     */
    async createFeeStructure(tenantId: number, academicYearId: number, data: any) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Structure
            const structRes = await client.query(
                `INSERT INTO school.fee_structure (tenant_id, academic_year_id, name, total_amount) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [tenantId, academicYearId, data.name, data.total_amount]
            );
            const structure = structRes.rows[0];

            // 2. Add Items (Heads + Installments)
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await client.query(
                        `INSERT INTO school.fee_structure_item (fee_structure_id, fee_head_id, amount, due_date, installment_name)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [structure.id, item.fee_head_id, item.amount, item.due_date, item.installment_name]
                    );
                }
            }

            await client.query('COMMIT');
            return structure;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Allocate a Fee Structure to a Student
     */
    async allocateFee(tenantId: number, studentId: number, structureId: number, academicYearId: number, existingClient?: any) {
        const client = existingClient || await this.pool.connect();
        try {
            if (!existingClient) await client.query('BEGIN');

            // 1. Check for existing allocation
            const existingRes = await client.query(
                `SELECT * FROM school.student_fee_allocation 
                 WHERE tenant_id = $1 AND student_id = $2 AND fee_structure_id = $3 AND academic_year_id = $4`,
                [tenantId, studentId, structureId, academicYearId]
            );

            if (existingRes.rows.length > 0) {
                if (!existingClient) await client.query('COMMIT');
                return existingRes.rows[0];
            }

            // 2. Create Allocation
            const allocRes = await client.query(
                `INSERT INTO school.student_fee_allocation (tenant_id, student_id, fee_structure_id, academic_year_id)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [tenantId, studentId, structureId, academicYearId]
            );
            const allocation = allocRes.rows[0];

            // 1b. Fetch student name for Partner creation
            const studentRes = await client.query(`SELECT first_name || ' ' || last_name as name FROM school.student WHERE id = $1`, [studentId]);
            const studentName = studentRes.rows[0]?.name || `Student ${studentId}`;

            // 2. Resolve the student as an accounting 'Partner'
            let partnerRes = await client.query(
                `SELECT id FROM accounting.partner WHERE tenant_id = $1 AND external_ref_type = 'student' AND external_ref_id = $2`,
                [tenantId, studentId]
            );
            
            let partnerId;
            if (partnerRes.rows.length === 0) {
                const pInsert = await client.query(
                    `INSERT INTO accounting.partner (tenant_id, name, type, external_ref_type, external_ref_id)
                     VALUES ($1, $2, 'customer', 'student', $3) RETURNING id`,
                    [tenantId, studentName, studentId]
                );
                partnerId = pInsert.rows[0].id;
                console.log(`[FeeService] Created new partner ${partnerId} for student ${studentId}`);
            } else {
                partnerId = partnerRes.rows[0].id;
                console.log(`[FeeService] Using existing partner ${partnerId} for student ${studentId}`);
            }

            // 3. Group fee items by installment name (e.g. "Term 1")
            const itemsRes = await client.query(
                `SELECT * FROM school.fee_structure_item WHERE fee_structure_id = $1 ORDER BY due_date ASC`,
                [structureId]
            );

            const groupedItems: { [key: string]: any[] } = {};
            itemsRes.rows.forEach((item: any) => {
                const key = item.installment_name || 'General';
                if (!groupedItems[key]) groupedItems[key] = [];
                groupedItems[key].push(item);
            });

            let totalStructureAmount = 0;

            for (const [groupName, items] of Object.entries(groupedItems)) {
                let groupTotal = 0;
                items.forEach((item: any) => groupTotal += parseFloat(item.amount));
                totalStructureAmount += groupTotal;

                const firstItem = items[0];
                const groupDueDate = firstItem.due_date || new Date();

                // 4. Create ONE professional Invoice for this group
                const invoiceNo = `INV-${studentId}-${Date.now()}-${Math.floor(Math.random()*100)}`;
                console.log(`[FeeService] Generating Invoice ${invoiceNo} (Amount: ${groupTotal}, Due: ${groupDueDate})`);
                
                const invoiceRes = await client.query(
                    `INSERT INTO accounting.invoice (
                        tenant_id, partner_id, invoice_no, invoice_date, due_date, 
                        total_amount, net_amount, due_amount, status, source_type, source_id
                    )
                    VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $5, $5, 'unpaid', 'fee_group', $6)
                    RETURNING id`,
                    [tenantId, partnerId, invoiceNo, groupDueDate, groupTotal, allocation.id]
                );
                const invoiceId = invoiceRes.rows[0].id;
                console.log(`[FeeService] Invoice created: ID ${invoiceId}`);

                // 5. Create Individual installments and link to the same invoice
                for (const item of items) {
                    await client.query(
                        `INSERT INTO school.fee_installment (allocation_id, fee_structure_item_id, invoice_id, amount_due, status, due_date)
                         VALUES ($1, $2, $3, $4, 'UNPAID', $5)`,
                        [allocation.id, item.id, invoiceId, item.amount, item.due_date || groupDueDate]
                    );

                    // 6. Create Invoice Line for itemized billing
                    const headRes = await client.query(`SELECT name FROM school.fee_head WHERE id = $1`, [item.fee_head_id]);
                    const headName = headRes.rows[0]?.name || 'Fee Component';

                    await client.query(
                        `INSERT INTO accounting.invoice_line (tenant_id, invoice_id, description, quantity, unit_price, amount, ledger_account_id)
                         VALUES ($1, $2, $3, 1, $4, $4, (SELECT ledger_account_id FROM school.fee_head WHERE id = $5))`,
                        [tenantId, invoiceId, `${headName} (${groupName})`, item.amount, item.fee_head_id]
                    );
                }
            }

            // 7. Post Revenue Recognition Journal Entry (Accrual)
            const arAccountRes = await client.query(`SELECT account_id FROM accounting.system_account_mapping WHERE tenant_id = $1 AND mapping_key = 'ASSET_RECEIVABLE'`, [tenantId]);
            const defaultRevRes = await client.query(`SELECT account_id FROM accounting.system_account_mapping WHERE tenant_id = $1 AND mapping_key = 'REV_GENERAL'`, [tenantId]);

            if (arAccountRes.rows.length > 0) {
                const arAccount = arAccountRes.rows[0].account_id;
                const defaultRevAccount = defaultRevRes.rows[0]?.account_id;

                const journalRes = await client.query(
                    `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, transaction_type, metadata)
                     VALUES ($1, CURRENT_DATE, $2, $3, 'fee_allocation', $4) RETURNING id`,
                    [
                        tenantId, 
                        `ALLOC-${allocation.id}`, 
                        `Fee Allocation: ${studentName}`, 
                        JSON.stringify({ allocation_id: allocation.id, student_id: studentId })
                    ]
                );
                const journalId = journalRes.rows[0].id;

                // Debit AR (Total Structure Amount)
                await client.query(`INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, partner_id, partner_type) VALUES ($1, $2, $3, $4, 0, $5, 'student')`, [tenantId, journalId, arAccount, totalStructureAmount, studentId]);
                
                // Credit Revenue (Broken down by Head)
                for (const item of itemsRes.rows) {
                    const headRes = await client.query(`SELECT ledger_account_id FROM school.fee_head WHERE id = $1`, [item.fee_head_id]);
                    const headAccount = headRes.rows[0]?.ledger_account_id || defaultRevAccount;

                    if (headAccount) {
                        await client.query(`INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, 0, $4)`, [tenantId, journalId, headAccount, item.amount]);
                    }
                }
            }

            if (!existingClient) await client.query('COMMIT');
            return allocation;
        } catch (err) {
            if (!existingClient) await client.query('ROLLBACK');
            throw err;
        } finally {
            if (!existingClient) client.release();
        }
    }

    async getStudentFees(tenantId: number, studentId: number, existingClient?: any) {
        const client = existingClient || this.pool;
        const query = `
            SELECT 
                fi.*,
                fh.name as head_name,
                fsi.installment_name,
                sfa.status as allocation_status
            FROM school.fee_installment fi
            JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
            JOIN school.fee_structure_item fsi ON fi.fee_structure_item_id = fsi.id
            JOIN school.fee_head fh ON fsi.fee_head_id = fh.id
            WHERE sfa.tenant_id = $1 AND sfa.student_id = $2
            ORDER BY fi.due_date ASC
        `;
        const res = await client.query(query, [tenantId, studentId]);
        return res.rows;
    }

    async getFeeHeads(tenantId: number) {
        const query = `
            SELECT fh.*, a.name as account_name, a.code as account_code
            FROM school.fee_head fh
            LEFT JOIN accounting.chart_of_accounts a ON fh.ledger_account_id = a.id
            WHERE fh.tenant_id = $1 
            ORDER BY fh.name ASC
        `;
        const res = await this.pool.query(query, [tenantId]);
        return res.rows;
    }

    async getFeeStructures(tenantId: number, academicYearId: number) {
        const query = `
            SELECT 
                fs.*,
                (SELECT count(*) FROM school.fee_structure_item WHERE fee_structure_id = fs.id) as item_count
            FROM school.fee_structure fs 
            WHERE tenant_id = $1 AND academic_year_id = $2 
            ORDER BY created_at DESC
        `;
        const res = await this.pool.query(query, [tenantId, academicYearId]);
        return res.rows;
    }

    async getFeeDiscounts(tenantId: number) {
        const query = `SELECT * FROM school.fee_discount WHERE tenant_id = $1 ORDER BY name ASC`;
        const res = await this.pool.query(query, [tenantId]);
        return res.rows;
    }

    async getCollections(tenantId: number, academicYearId: number) {
        const query = `
            SELECT 
                s.id as student_id,
                s.first_name || ' ' || s.last_name as student_name,
                s.admission_no,
                c.name as classroom_name,
                SUM(fi.amount_due) as total_due,
                SUM(fi.amount_paid) as total_paid,
                SUM(fi.amount_due - fi.amount_paid) as balance,
                MIN(fi.id) as oldest_installment_id
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id
            JOIN school.classroom c ON se.classroom_id = c.id
            JOIN school.student_fee_allocation sfa ON s.id = sfa.student_id
            JOIN school.fee_installment fi ON sfa.id = fi.allocation_id
            WHERE s.tenant_id = $1 AND se.status = 'active' AND sfa.academic_year_id = $2
            GROUP BY s.id, s.first_name, s.last_name, s.admission_no, c.name
            HAVING SUM(fi.amount_due - fi.amount_paid) > 0
            ORDER BY balance DESC
        `;
        const res = await this.pool.query(query, [tenantId, academicYearId]);
        return res.rows;
    }

    async getReceipts(tenantId: number) {
        const query = `
            SELECT 
                MAX(fi.id) as receipt_id,
                fi.last_payment_date as payment_date,
                SUM(fi.amount_paid) as amount,
                s.first_name || ' ' || s.last_name as student_name,
                s.admission_no,
                STRING_AGG(fh.name, \', \') as fee_heads,
                JSON_AGG(JSON_BUILD_OBJECT(
                    \'name\', fh.name,
                    \'amount\', fi.amount_paid,
                    \'installment\', fsi.installment_name
                )) as components,
                MAX(fi.status) as status
            FROM school.fee_installment fi
            JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
            JOIN school.student s ON sfa.student_id = s.id
            JOIN school.fee_structure_item fsi ON fi.fee_structure_item_id = fsi.id
            JOIN school.fee_head fh ON fsi.fee_head_id = fh.id
            WHERE sfa.tenant_id = $1 AND fi.amount_paid > 0
            GROUP BY fi.allocation_id, fi.last_payment_date, s.first_name, s.last_name, s.admission_no
            ORDER BY fi.last_payment_date DESC
            LIMIT 100
        `;
        const res = await this.pool.query(query, [tenantId]);
        return res.rows;
    }

    async getFinanceStats(tenantId: number, academicYearId: number) {
        const query = `
            SELECT 
                COALESCE(SUM(fi.amount_due), 0) as total_expected,
                COALESCE(SUM(fi.amount_paid), 0) as total_collected,
                COALESCE(SUM(fi.amount_due - fi.amount_paid), 0) as total_outstanding,
                COUNT(*) FILTER (WHERE fi.due_date < CURRENT_DATE AND fi.status != 'PAID') as late_payments
            FROM school.fee_installment fi
            JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
            WHERE sfa.tenant_id = $1 AND sfa.academic_year_id = $2
        `;
        const res = await this.pool.query(query, [tenantId, academicYearId]);
        return res.rows[0];
    }

    async recordPayment(tenantId: number, installmentId: number, amount: number, options: { payment_method?: string, bank_account_id?: number, reference?: string } = {}, existingClient?: any) {
        const client = existingClient || await this.pool.connect();
        try {
            if (!existingClient) await client.query('BEGIN');
            
            // 1. Get current installment state (verify tenant through allocation)
            const currentRes = await client.query(
                `SELECT fi.amount_due, fi.amount_paid, fi.invoice_id, sfa.student_id, s.first_name || ' ' || s.last_name as student_name
                 FROM school.fee_installment fi
                 JOIN school.student_fee_allocation sfa ON fi.allocation_id = sfa.id
                 JOIN school.student s ON sfa.student_id = s.id
                 WHERE fi.id = $1 AND sfa.tenant_id = $2 FOR UPDATE`,
                [installmentId, tenantId]
            );
            if (currentRes.rows.length === 0) throw new Error("Installment not found");
            
            const { amount_due, amount_paid, invoice_id, student_id, student_name } = currentRes.rows[0];
            const newPaid = parseFloat(amount_paid) + amount;
            const status = newPaid >= parseFloat(amount_due) ? 'PAID' : 'PARTIAL';

            // 2. Update installment
            await client.query(
                `UPDATE school.fee_installment 
                 SET amount_paid = $1, status = $2, last_payment_date = CURRENT_DATE 
                 WHERE id = $3`,
                [newPaid, status, installmentId]
            );
            
            // 3. SYNC TO ACCOUNTING MODULE
            if (invoice_id) {
                // Update Unified Generic Invoice (The NEW way)
                // First, update the invoice itself
                await client.query(
                    `UPDATE accounting.invoice 
                     SET paid_amount = paid_amount + $1, 
                         due_amount = net_amount - (paid_amount + $1),
                         status = CASE WHEN (net_amount - (paid_amount + $1)) <= 0 THEN 'paid' ELSE 'partial' END,
                         updated_at = NOW()
                     WHERE id = $2 AND tenant_id = $3`,
                    [amount, invoice_id, tenantId]
                );

                // Now, get the fresh invoice state to distribute payments to siblings
                const invoiceStateRes = await client.query(`SELECT paid_amount FROM accounting.invoice WHERE id = $1`, [invoice_id]);
                let totalPaidOnInvoice = parseFloat(invoiceStateRes.rows[0].paid_amount);

                // Get all installments linked to this invoice, ordered by ID or Priority
                const siblingsRes = await client.query(
                    `SELECT id, amount_due FROM school.fee_installment WHERE invoice_id = $1 ORDER BY id ASC`,
                    [invoice_id]
                );

                // Redistribute the total paid amount across siblings
                let remainingToDistribute = totalPaidOnInvoice;
                for (const sibling of siblingsRes.rows) {
                    const siblingDue = parseFloat(sibling.amount_due);
                    const siblingPaid = Math.min(remainingToDistribute, siblingDue);
                    const siblingStatus = siblingPaid >= siblingDue ? 'PAID' : (siblingPaid > 0 ? 'PARTIAL' : 'UNPAID');

                    await client.query(
                        `UPDATE school.fee_installment SET amount_paid = $1, status = $2 WHERE id = $3`,
                        [siblingPaid, siblingStatus, sibling.id]
                    );
                    remainingToDistribute -= siblingPaid;
                }

                // [Legacy Support] 
                await client.query(
                    `UPDATE accounting.fee_invoice 
                     SET paid_amount = paid_amount + $1, 
                         due_amount = net_amount - (paid_amount + $1),
                         status = CASE WHEN (net_amount - (paid_amount + $1)) <= 0 THEN 'paid' ELSE 'partial' END,
                         updated_at = NOW()
                     WHERE id = $2 AND tenant_id = $3`,
                    [amount, installmentId, tenantId]
                );

                // Post Journal Entry (Debit Cash/Bank, Credit AR)
                const arAccountRes = await client.query(`SELECT account_id FROM accounting.system_account_mapping WHERE tenant_id = $1 AND mapping_key = 'ASSET_RECEIVABLE'`, [tenantId]);
                
                let targetAssetAccount: number | null = null;

                if (options.payment_method === 'bank' || options.payment_method === 'online') {
                    // Get bank's GL account
                    const bankRes = await client.query(`SELECT gl_account_id FROM accounting.bank_account WHERE id = $1 AND tenant_id = $2`, [options.bank_account_id, tenantId]);
                    targetAssetAccount = bankRes.rows[0]?.gl_account_id;
                }

                if (!targetAssetAccount) {
                    // Fallback to default cash account
                    const cashAccountRes = await client.query(`SELECT account_id FROM accounting.system_account_mapping WHERE tenant_id = $1 AND mapping_key = 'ASSET_CASH'`, [tenantId]);
                    targetAssetAccount = cashAccountRes.rows[0]?.account_id;
                }
                
                if (arAccountRes.rows.length > 0 && targetAssetAccount) {
                    const arAccount = arAccountRes.rows[0].account_id;
                    
                    const journalRes = await client.query(
                        `INSERT INTO accounting.journal_entry (tenant_id, entry_date, reference_no, description, transaction_type, metadata)
                         VALUES ($1, CURRENT_DATE, $2, $3, 'fee_payment', $4) RETURNING id`,
                        [
                            tenantId, 
                            options.reference || `RCPT-${Date.now()}`, 
                            `Fee payment: ${student_name} (Inst ${installmentId})`, 
                            JSON.stringify({ 
                                installment_id: installmentId, 
                                invoice_id, 
                                student_id, 
                                payment_method: options.payment_method,
                                bank_account_id: options.bank_account_id 
                            })
                        ]
                    );
                    const journalId = journalRes.rows[0].id;
                    
                    // Debit Asset (Cash or Bank)
                    await client.query(`INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit) VALUES ($1, $2, $3, $4, 0)`, [tenantId, journalId, targetAssetAccount, amount]);
                    
                    // Credit AR (Accounts Receivable)
                    await client.query(`INSERT INTO accounting.journal_item (tenant_id, journal_entry_id, account_id, debit, credit, partner_id, partner_type) VALUES ($1, $2, $3, 0, $4, $5, 'student')`, [tenantId, journalId, arAccount, amount, student_id]);
                }
            }

            if (!existingClient) await client.query('COMMIT');
            return { success: true, newStatus: status };
        } catch (err) {
            if (!existingClient) await client.query('ROLLBACK');
            throw err;
        } finally {
            if (!existingClient) client.release();
        }
    }

    async updateFeeHead(tenantId: number, id: number, data: any) {
        const query = `
            UPDATE school.fee_head 
            SET name = $1, code = $2, is_refundable = $3, ledger_account_id = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND tenant_id = $6
            RETURNING *
        `;
        const res = await this.pool.query(query, [data.name, data.code, data.is_refundable, data.ledger_account_id, id, tenantId]);
        return res.rows[0];
    }

    async deleteFeeHead(tenantId: number, id: number) {
        // Check if head is in use in any structure
        const checkRes = await this.pool.query(`SELECT count(*) FROM school.fee_structure_item WHERE fee_head_id = $1`, [id]);
        if (parseInt(checkRes.rows[0].count) > 0) {
            throw new Error("Cannot delete fee component because it is currently used in one or more fee structures.");
        }

        const query = `DELETE FROM school.fee_head WHERE id = $1 AND tenant_id = $2`;
        await this.pool.query(query, [id, tenantId]);
        return { success: true };
    }

    /**
     * Grade Fee Templates
     */
    async getGradeFeeTemplates(tenantId: number, academicYearId: number) {
        const query = `
            SELECT t.*, g.name as grade_name, fs.name as structure_name
            FROM school.grade_fee_template t
            JOIN school.grade g ON t.grade_id = g.id
            JOIN school.fee_structure fs ON t.fee_structure_id = fs.id
            WHERE t.tenant_id = $1 AND t.academic_year_id = $2
        `;
        const res = await this.pool.query(query, [tenantId, academicYearId]);
        return res.rows;
    }

    async saveGradeFeeTemplate(tenantId: number, data: any) {
        const query = `
            INSERT INTO school.grade_fee_template (tenant_id, academic_year_id, grade_id, fee_structure_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (tenant_id, academic_year_id, grade_id) 
            DO UPDATE SET fee_structure_id = EXCLUDED.fee_structure_id, updated_at = NOW()
            RETURNING *
        `;
        const res = await this.pool.query(query, [tenantId, data.academic_year_id, data.grade_id, data.fee_structure_id]);
        return res.rows[0];
    }

    /**
     * Bulk Allocate Fees
     */
    async bulkAllocate(tenantId: number, academicYearId: number, payload: { student_ids: number[], fee_structure_id: number }) {
        const client = await this.pool.connect();
        const results = { successful: 0, failed: 0, errors: [] as string[] };

        try {
            await client.query('BEGIN');

            for (const studentId of payload.student_ids) {
                try {
                    await this.allocateFee(tenantId, studentId, payload.fee_structure_id, academicYearId, client);
                    results.successful++;
                } catch (err: any) {
                    results.failed++;
                    results.errors.push(`Student ID ${studentId}: ${err.message}`);
                }
            }

            await client.query('COMMIT');
            return results;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

