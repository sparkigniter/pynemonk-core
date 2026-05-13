import { inject, injectable } from "tsyringe";
import PayrollHelper from "../helpers/PayrollHelper.js";

@injectable()
export default class PayrollService {
    constructor(
        private payrollHelper: PayrollHelper,
        @inject("EventBus") private eventBus: any
    ) {}

    public async generateMonthlyPayslip(tenantId: number, staffId: number, month: number, year: number) {
        const structure = await this.payrollHelper.getSalaryStructure(tenantId, staffId);
        if (!structure) throw new Error("Salary structure not found for staff");

        const totalAllowances = structure.allowances.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
        const totalDeductions = structure.deductions.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0);
        const netSalary = Number(structure.base_salary) + totalAllowances - totalDeductions;

        return this.payrollHelper.createPayslip({
            tenant_id: tenantId,
            staff_id: staffId,
            month,
            year,
            base_salary: structure.base_salary,
            total_allowances: totalAllowances,
            total_deductions: totalDeductions,
            net_salary: netSalary
        });
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
