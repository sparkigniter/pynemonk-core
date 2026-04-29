import { injectable, inject } from "tsyringe";
import SubjectHelper from "../helpers/SubjectHelper.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export default class SubjectService {
    constructor(
        @inject(SubjectHelper) private subjectHelper: SubjectHelper,
        @inject(AcademicYearHelper) private academicYearHelper: AcademicYearHelper
    ) {}

    public async getSubjects(tenantId: number, filters: any = {}) {
        return this.subjectHelper.findAll(tenantId, filters);
    }

    public async getSubjectById(tenantId: number, id: number) {
        return this.subjectHelper.findById(tenantId, id);
    }

    public async addSubject(tenantId: number, data: any) {
        return this.subjectHelper.create(tenantId, data);
    }

    public async updateSubject(tenantId: number, id: number, data: any) {
        return this.subjectHelper.update(tenantId, id, data);
    }

    public async removeSubject(tenantId: number, id: number) {
        return this.subjectHelper.delete(tenantId, id);
    }

    public async assignTeacher(tenantId: number, data: any) {
        return this.subjectHelper.assignTeacher(tenantId, data);
    }

    public async bulkAssignTeachers(tenantId: number, assignments: any[]) {
        const results = [];
        for (const data of assignments) {
            results.push(await this.subjectHelper.assignTeacher(tenantId, data));
        }
        return results;
    }

    public async getAssignments(tenantId: number, filters: any = {}) {
        if (!filters.academic_year_id) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            filters.academic_year_id = currentYear?.id;
        }
        return this.subjectHelper.getAssignments(tenantId, filters);
    }
}
