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
}
