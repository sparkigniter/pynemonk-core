import { injectable, inject } from "tsyringe";
import ClassroomHelper from "../helpers/ClassroomHelper.js";

@injectable()
export default class ClassroomService {
    constructor(@inject(ClassroomHelper) private classroomHelper: ClassroomHelper) {}

    public async getClassrooms(tenantId: number, academicYearId?: number) {
        return this.classroomHelper.findAll(tenantId, academicYearId);
    }

    public async getClassroomById(tenantId: number, id: number) {
        return this.classroomHelper.findById(tenantId, id);
    }

    public async addClassroom(tenantId: number, data: any) {
        return this.classroomHelper.create({ ...data, tenant_id: tenantId });
    }

    public async updateClassroom(tenantId: number, id: number, data: any) {
        return this.classroomHelper.update(tenantId, id, data);
    }

    public async removeClassroom(tenantId: number, id: number) {
        return this.classroomHelper.delete(tenantId, id);
    }
}
