import { injectable, inject } from "tsyringe";
import e from "express";
import StudentService from "../services/StudentService.js";
import { AdmissionNumberService } from "../services/AdmissionNumberService.js";
import ApiResponseHandler from "../../../core/ApiResponseHandler.js";
import ResourceController from "../../../core/controllers/ResourceController.js";

@injectable()
export default class StudentController extends ResourceController {
    constructor(
        @inject(StudentService) private studentService: StudentService,
        @inject(AdmissionNumberService) private admissionNumberService: AdmissionNumberService
    ) {
        super();
    }

    public async getNextAdmissionNumber(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.admissionNumberService.getNextAdmissionNumber(tenantId);
            ApiResponseHandler.ok(res, "Success", { admission_no: data });
        } catch (error: any) {
            ApiResponseHandler.badrequest(res, "Failed to generate admission number");
        }
    }

    public async getSettings(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.admissionNumberService.getSettings(tenantId);
            ApiResponseHandler.ok(res, "Success", data);
        } catch (error: any) {
            ApiResponseHandler.badrequest(res, "Failed to fetch settings");
        }
    }

    public async updateSettings(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.admissionNumberService.updateSettings(tenantId, req.body);
            ApiResponseHandler.ok(res, "Settings updated successfully", data);
        } catch (error: any) {
            ApiResponseHandler.badrequest(res, "Failed to update settings");
        }
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
            const scope = await this.getScope(req);
            const user = (req as any).user;
            const canReadFull = user.permissions.includes('student:read') || scope.accessLevel === "FULL";

            // HYBRID SECURITY: Access is restricted to scope unless user has FULL access.
            if (!canReadFull && !scope.hasStudent(studentId)) {
                ApiResponseHandler.forbidden(res, "You do not have access to this student's profile");
                return;
            }

            const student = await this.studentService.getStudentProfile(tenantId, studentId);
            if (!student) {
                ApiResponseHandler.badrequest(res, "Student not found");
                return;
            }
            
            ApiResponseHandler.ok(res, "Success", canReadFull ? student : this.sanitizeStudent(student));
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to fetch student");
        }
    }

    public async list(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const scope = await this.getScope(req);
            const user = (req as any).user;
            const { page, limit, search, classroom_id, academic_year_id, gender, blood_group, religion, nationality, grade_id } = req.query;
            const filters: any = {
                page: page ? parseInt(page as string, 10) : 1,
                limit: limit ? parseInt(limit as string, 10) : 10,
                search: search as string,
                classroom_id: classroom_id ? parseInt(classroom_id as string) : undefined,
                academic_year_id: academic_year_id ? parseInt(academic_year_id as string) : undefined,
                gender: gender as string,
                blood_group: blood_group as string,
                religion: religion as string,
                nationality: nationality as string,
                grade_id: grade_id ? parseInt(grade_id as string) : undefined
            };

            const canReadFull = user.permissions.includes('student:read') || scope.accessLevel === "FULL";
            const canReadDirectory = user.permissions.includes('student.directory:read');

            // HYBRID SECURITY: Visibility is ALWAYS restricted to scope unless user has FULL access.
            // Directory read only controls sanitization, not bypass of the data scope.
            if (!canReadFull) {
                filters.ids = scope.studentIds;
            }

            const result = await this.studentService.listStudents(tenantId, filters);
            
            // Sanitize if not full access
            if (!canReadFull) {
                result.data = result.data.map((s: any) => this.sanitizeStudent(s));
            }

            ApiResponseHandler.ok(res, "Success", result);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to list students");
        }
    }

    /**
     * Strips sensitive PII from student record for public directory view.
     */
    private sanitizeStudent(student: any) {
        const {
            phone,
            address,
            date_of_birth,
            blood_group,
            nationality,
            religion,
            guardian_id,
            ...sanitized
        } = student;
        return sanitized;
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

    public async update(req: e.Request, res: e.Response): Promise<void> {
        try {
            const tenantId = this.getTenantId(req);
            const studentId = parseInt(req.params.id, 10);
            const student = await this.studentService.updateStudentProfile(tenantId, studentId, req.body);
            ApiResponseHandler.ok(res, "Student updated successfully", student);
        } catch (error: any) {
            console.error(error);
            ApiResponseHandler.badrequest(res, "Failed to update student");
        }
    }
}
