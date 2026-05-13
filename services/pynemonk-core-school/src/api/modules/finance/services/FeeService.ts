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
    async allocateFee(tenantId: number, studentId: number, structureId: number, academicYearId: number) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Create Allocation
            const allocRes = await client.query(
                `INSERT INTO school.student_fee_allocation (tenant_id, student_id, fee_structure_id, academic_year_id)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [tenantId, studentId, structureId, academicYearId]
            );
            const allocation = allocRes.rows[0];

            // 2. Generate Installments (The ledger entries)
            const itemsRes = await client.query(
                `SELECT * FROM school.fee_structure_item WHERE fee_structure_id = $1`,
                [structureId]
            );

            for (const item of itemsRes.rows) {
                await client.query(
                    `INSERT INTO school.fee_installment (allocation_id, fee_structure_item_id, amount_due, due_date)
                     VALUES ($1, $2, $3, $4)`,
                    [allocation.id, item.id, item.amount, item.due_date]
                );
            }

            await client.query('COMMIT');
            return allocation;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    async getStudentFees(tenantId: number, studentId: number) {
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
        const res = await this.pool.query(query, [tenantId, studentId]);
        return res.rows;
    }
}
