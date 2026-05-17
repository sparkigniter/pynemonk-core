import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { FeeService } from '../services/FeeService.js';

@injectable()
export default class FeeController extends BaseController {
    constructor(private feeService: FeeService) {
        super();
    }

    async createFeeHead(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const head = await this.feeService.createFeeHead(tenantId, req.body);
            return this.ok(res, "Fee Head created successfully", head);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async createFeeStructure(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required in headers (x-academic-year-id) or query.");
            
            const structure = await this.feeService.createFeeStructure(tenantId, academicYearId, req.body);
            return this.ok(res, "Fee Structure created successfully", structure);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async allocateFeesToStudent(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required.");

            const { student_id, fee_structure_id } = req.body;
            const allocation = await this.feeService.allocateFee(tenantId, student_id, fee_structure_id, academicYearId);
            return this.ok(res, "Fees allocated to student", allocation);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getStudentFees(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const studentId = parseInt(req.params.studentId);
            const fees = await this.feeService.getStudentFees(tenantId, studentId);
            return this.ok(res, "Student fees retrieved", fees);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getFeeHeads(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const heads = await this.feeService.getFeeHeads(tenantId);
            return this.ok(res, "Fee Heads retrieved", heads);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getFeeStructures(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required.");
            
            const structures = await this.feeService.getFeeStructures(tenantId, academicYearId);
            return this.ok(res, "Fee Structures retrieved", structures);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getFeeDiscounts(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const discounts = await this.feeService.getFeeDiscounts(tenantId);
            return this.ok(res, "Fee Discounts (Concessions) retrieved", discounts);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getCollections(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required.");
            
            const result = await this.feeService.getCollections(tenantId, academicYearId);
            return this.ok(res, "Collections fetched successfully", result);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getReceipts(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const receipts = await this.feeService.getReceipts(tenantId);
            return this.ok(res, "Fee Receipts retrieved", receipts);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getFinanceStats(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required.");
            
            const stats = await this.feeService.getFinanceStats(tenantId, academicYearId);
            return this.ok(res, "Finance Stats retrieved", stats);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async recordPayment(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const { installment_id, amount, payment_method, bank_account_id, reference } = req.body;
            if (!installment_id || !amount) return this.badrequest(res, "Installment ID and amount are required.");
            
            const result = await this.feeService.recordPayment(tenantId, installment_id, amount, {
                payment_method,
                bank_account_id,
                reference
            });
            return this.ok(res, "Payment recorded successfully", result);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async allocateFee(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            const { student_id, structure_id } = req.body;
            
            if (!student_id || !structure_id || !academicYearId) {
                return this.badrequest(res, "Student ID, Structure ID, and Academic Year are required.");
            }
            
            const result = await this.feeService.allocateFee(tenantId, student_id, structure_id, academicYearId);
            return this.ok(res, "Fee allocated successfully", result);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async updateFeeHead(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const head = await this.feeService.updateFeeHead(tenantId, id, req.body);
            return this.ok(res, "Fee Head updated successfully", head);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async deleteFeeHead(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.feeService.deleteFeeHead(tenantId, id);
            return this.ok(res, "Fee Head deleted successfully");
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async getGradeFeeTemplates(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required.");
            const templates = await this.feeService.getGradeFeeTemplates(tenantId, academicYearId);
            return this.ok(res, "Grade Fee Templates retrieved", templates);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async saveGradeFeeTemplate(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const template = await this.feeService.saveGradeFeeTemplate(tenantId, req.body);
            return this.ok(res, "Grade Fee Template saved", template);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }

    async bulkAllocate(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const academicYearId = this.getAcademicYearId(req);
            if (!academicYearId) return this.badrequest(res, "Academic Year ID is required.");
            const result = await this.feeService.bulkAllocate(tenantId, academicYearId, req.body);
            return this.ok(res, "Bulk allocation completed", result);
        } catch (err: any) {
            return this.badrequest(res, err.message);
        }
    }
}

