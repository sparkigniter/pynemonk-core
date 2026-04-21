import { injectable, inject } from "tsyringe";
import ClassroomHelper from "../helpers/ClassroomHelper.js";
import AcademicYearHelper from "../../academics/helpers/AcademicYearHelper.js";

@injectable()
export default class ClassroomService {
    constructor(
        @inject(ClassroomHelper) private classroomHelper: ClassroomHelper,
        @inject(AcademicYearHelper) private academicYearHelper: AcademicYearHelper
    ) {}

    public async getClassrooms(tenantId: number, academicYearId?: number) {
        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            academicYearId = currentYear?.id;
        }
        return this.classroomHelper.findAll(tenantId, academicYearId);
    }

    public async getClassroomById(tenantId: number, id: number) {
        return this.classroomHelper.findById(tenantId, id);
    }

    public async addClassroom(tenantId: number, data: any) {
        let academicYearId = data.academic_year_id;

        if (!academicYearId) {
            const currentYear = await this.academicYearHelper.findCurrent(tenantId);
            if (!currentYear) {
                throw new Error("No current academic year found for this tenant. Please specify one or set a current year.");
            }
            academicYearId = currentYear.id;
        }

        return this.classroomHelper.create({ 
            ...data, 
            tenant_id: tenantId,
            academic_year_id: academicYearId
        });
    }

    public async updateClassroom(tenantId: number, id: number, data: any) {
        return this.classroomHelper.update(tenantId, id, data);
    }

    public async removeClassroom(tenantId: number, id: number) {
        return this.classroomHelper.delete(tenantId, id);
    }
}
