import { inject, injectable } from "tsyringe";
import PayrollHelper from "../helpers/PayrollHelper.js";

@injectable()
export default class PayrollService {
    constructor(
        private payrollHelper: PayrollHelper,
        @inject("EventBus") private eventBus: any
    ) {}

    public async generateMonthlyPayslip(tenantId: number, staffId: number, month: number, year: number) {
        const existing = await this.payrollHelper.getPayslipForPeriod(tenantId, staffId, month, year);
        if (existing) {
            throw new Error(`Payslip already generated for ${month}/${year}`);
        }

        const structure = await this.payrollHelper.getSalaryStructure(tenantId, staffId);
        if (!structure) throw new Error("Salary structure not found for staff");

        const totalAllowances = structure.allowances.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
        const totalDeductions = structure.deductions.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
        const netSalary = Number(structure.base_salary) + totalAllowances - totalDeductions;

        const slip = await this.payrollHelper.createPayslip({
            tenant_id: tenantId,
            staff_id: staffId,
            month,
            year,
            base_salary: structure.base_salary,
            total_allowances: totalAllowances,
            total_deductions: totalDeductions,
            net_salary: netSalary
        });

        const staffRes = await (this.payrollHelper as any).db.query(
            `SELECT first_name, last_name FROM school.staff WHERE id = $1`,
            [staffId]
        );
        const staff = staffRes.rows[0];
        const fullName = staff ? `${staff.first_name} ${staff.last_name}` : 'Staff Member';

        this.eventBus.emit('PAYROLL_GENERATED', {
            tenantId,
            payslipId: slip.id,
            staffId,
            month,
            year,
            netSalary,
            fullName
        });

        return slip;
    }

    public async generateBulkPayslips(tenantId: number, month: number, year: number) {
        const staffRes = await (this.payrollHelper as any).db.query(
            `SELECT id, first_name, last_name, employee_code FROM school.staff WHERE tenant_id = $1 AND is_deleted = FALSE`,
            [tenantId]
        );
        const staffList = staffRes.rows;

        const results: {
            processed: any[];
            skipped: any[];
        } = {
            processed: [],
            skipped: []
        };

        for (const staff of staffList) {
            const fullName = `${staff.first_name} ${staff.last_name}`;
            try {
                // Check if already issued for the month
                const existing = await this.payrollHelper.getPayslipForPeriod(tenantId, staff.id, month, year);
                if (existing) {
                    results.skipped.push({
                        staffId: staff.id,
                        name: fullName,
                        reason: `Payslip already generated for ${month}/${year}`
                    });
                    continue;
                }

                // Check if compensation structure is set
                const structure = await this.payrollHelper.getSalaryStructure(tenantId, staff.id);
                if (!structure) {
                    results.skipped.push({
                        staffId: staff.id,
                        name: fullName,
                        reason: "Compensation model not initialized (salary structure missing)"
                    });
                    continue;
                }

                const totalAllowances = structure.allowances.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
                const totalDeductions = structure.deductions.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
                const netSalary = Number(structure.base_salary) + totalAllowances - totalDeductions;

                const slip = await this.payrollHelper.createPayslip({
                    tenant_id: tenantId,
                    staff_id: staff.id,
                    month,
                    year,
                    base_salary: structure.base_salary,
                    total_allowances: totalAllowances,
                    total_deductions: totalDeductions,
                    net_salary: netSalary
                });

                this.eventBus.emit('PAYROLL_GENERATED', {
                    tenantId,
                    payslipId: slip.id,
                    staffId: staff.id,
                    month,
                    year,
                    netSalary,
                    fullName
                });

                results.processed.push({
                    staffId: staff.id,
                    name: fullName,
                    payslipId: slip.id,
                    netSalary
                });
            } catch (err: any) {
                results.skipped.push({
                    staffId: staff.id,
                    name: fullName,
                    reason: err.message || "Failed to generate"
                });
            }
        }

        return results;
    }

    public async processPayment(tenantId: number, payslipId: number, userId: number) {
        // 1. Update status to paid
        const payslip = await this.payrollHelper.updatePayslipStatus(tenantId, payslipId, 'paid');

        // 2. Sync with accounting system via EventBus
        this.eventBus.emit('PAYROLL_PAID', {
            tenantId,
            userId,
            payslipId: payslip.id,
            staffId: payslip.staff_id,
            amount: payslip.net_salary,
            month: payslip.month,
            year: payslip.year,
            reference: `PAY-${payslip.year}-${payslip.month}-${payslip.id}`
        });

        return payslip;
    }

    public async getStaffSalaryDetails(tenantId: number, staffId: number) {
        const [structure, payslips] = await Promise.all([
            this.payrollHelper.getSalaryStructure(tenantId, staffId),
            this.payrollHelper.getStaffPayslips(tenantId, staffId)
        ]);
        return { structure, payslips };
    }

    public async saveSalaryStructure(tenantId: number, staffId: number, data: any) {
        return this.payrollHelper.upsertSalaryStructure({
            ...data,
            tenant_id: tenantId,
            staff_id: staffId
        });
    }
}
