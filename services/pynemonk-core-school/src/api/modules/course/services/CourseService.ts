import { injectable, inject } from "tsyringe";
import CourseHelper from "../helpers/CourseHelper.js";

@injectable()
export default class CourseService {
    constructor(@inject(CourseHelper) private courseHelper: CourseHelper) {}

    public async getCourseList(tenantId: number, filters: any = {}) {
        return this.courseHelper.findAll(tenantId, filters);
    }

    public async getCourseById(tenantId: number, id: number) {
        return this.courseHelper.findById(tenantId, id);
    }

    public async addCourse(tenantId: number, data: any) {
        return this.courseHelper.create(tenantId, data);
    }

    public async updateCourse(tenantId: number, id: number, data: any) {
        return this.courseHelper.update(tenantId, id, data);
    }

    public async removeCourse(tenantId: number, id: number) {
        return this.courseHelper.delete(tenantId, id);
    }
}
