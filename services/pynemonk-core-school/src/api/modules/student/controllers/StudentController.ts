import { injectable, inject } from "tsyringe";
import e from "express";
import StudentService from "../services/StudentService.js";
import ApiResponseHandler from "../../../core/ApiResponseHandler.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export default class StudentController extends ResourceController {
    constructor(@inject(StudentService) private studentService: StudentService) {
        super();
    }

    public async create(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const student = await this.studentService.registerStudent(tenantId, req.body);
            ApiResponseHandler.ok(res, "Student created successfully", student);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, error.message || "Failed to create student");
        }
    }

    public async get(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const studentId = parseInt(req.params.id, 10);

            const student = await this.studentService.getStudentProfile(tenantId, studentId);
            if (!student) {
                ApiResponseHandler.badrequest(res, "Student not found");
                return;
            }
            ApiResponseHandler.ok(res, "Success", student);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to fetch student");
        }
    }

    public async list(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const scope = await this.getScope(req);
            const { page, limit, search, classroom_id, academic_year_id } = req.query;

            const filters = {
                page: page ? parseInt(page as string, 10) : 1,
                limit: limit ? parseInt(limit as string, 10) : 10,
                search: search as string,
                classroom_id: classroom_id ? parseInt(classroom_id as string) : undefined,
                academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined
            };

            const students = await this.studentService.listStudents(tenantId, filters, scope);
            ApiResponseHandler.ok(res, "Success", students);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to list students");
        }
    }

    public async uploadDocument(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const studentId = parseInt(req.params.id, 10);
            const doc = await this.studentService.addDocument(tenantId, studentId, req.body);
            ApiResponseHandler.ok(res, "Document uploaded successfully", doc);
        } catch (error: any) {
            ApiResponseHandler.badrequest(res, "Failed to upload document");
        }
    }

    public async getMe(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const userId = (req as any).user.userId;
            const student = await this.studentService.getStudentByUserId(tenantId, parseInt(userId));
            if (!student) {
                ApiResponseHandler.badrequest(res, "Student profile not found");
                return;
            }
            ApiResponseHandler.ok(res, "Success", student);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to fetch profile");
        }
    }
}
