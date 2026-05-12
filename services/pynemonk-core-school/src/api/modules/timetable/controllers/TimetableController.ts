import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { TimetableService } from "../services/TimetableService.js";
import ResourceController from "../../../core/controllers/ResourceController.js";
import { AccessLevel } from "../../../core/helpers/DataScopeHelper.js";

@injectable()
export class TimetableController extends ResourceController {
    constructor(@inject(TimetableService) private timetableService: TimetableService) {
        super();
    }

    async getByClassroom(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const classroomId = parseInt(req.params.classroomId);
            const scope = await this.getScope(req);

            if (!scope.hasClassroom(classroomId)) {
                return this.forbidden(res, "You do not have access to this classroom's timetable");
            }

            const data = await this.timetableService.getByClassroom(tenantId, classroomId);
            return this.ok(res, "Timetable retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async create(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can modify the timetable structure");
            }

            const tenantId = this.getTenantId(req);
            const entry = { ...req.body, tenant_id: tenantId };
            const data = await this.timetableService.createEntry(entry);
            return this.ok(res, "Timetable entry created", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can modify the timetable structure");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const entry = { ...req.body, tenant_id: tenantId };
            const data = await this.timetableService.updateEntry(id, entry);
            return this.ok(res, "Timetable entry updated", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can modify the timetable structure");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            await this.timetableService.deleteEntry(tenantId, id);
            return this.ok(res, "Timetable entry deleted");
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getSuggestions(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const teacherId = parseInt(req.query.teacher_id as string);
            const classroomId = parseInt(req.query.classroom_id as string);
            const day = parseInt(req.query.day as string);
            const data = await this.timetableService.getAvailableSlots(tenantId, teacherId, classroomId, day);
            return this.ok(res, "Available slots retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getTeacherSchedule(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const teacherId = parseInt(req.query.teacher_id as string);
            const scope = await this.getScope(req);

            if (!scope.hasStaff(teacherId)) {
                return this.forbidden(res, "You do not have access to this teacher's schedule");
            }

            const data = await this.timetableService.getTeacherSchedule(tenantId, teacherId, parseInt(req.query.day as string));
            return this.ok(res, "Teacher schedule retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getUniquePeriods(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.timetableService.getUniquePeriods(tenantId);
            return this.ok(res, "Periods retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getGlobalSchedule(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.timetableService.getGlobalSchedule(tenantId);
            return this.ok(res, "Global schedule retrieved", data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async autoGenerate(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Automated generation is restricted to administrators");
            }

            const tenantId = this.getTenantId(req);
            const classroomId = parseInt(req.params.classroomId);
            const academicYearId = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;
            const data = await this.timetableService.generateAutomatedTimetable(tenantId, classroomId, academicYearId);
            return res.json(data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async finalize(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Timetable finalization is restricted to administrators");
            }

            const tenantId = this.getTenantId(req);
            const classroomId = parseInt(req.params.classroomId);
            const academicYearId = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;
            const data = await this.timetableService.finalizeTimetable(tenantId, classroomId, academicYearId);
            return res.json(data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async toggleSticky(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can toggle sticky entries");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const { is_sticky } = req.body;
            const data = await this.timetableService.toggleSticky(tenantId, id, is_sticky);
            return res.json(data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getBreaks(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const data = await this.timetableService.getBreaks(tenantId);
            return res.json(data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async createBreak(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can create breaks");
            }

            const tenantId = this.getTenantId(req);
            const data = await this.timetableService.createBreak(tenantId, req.body);
            return res.json(data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async deleteBreak(req: Request, res: Response) {
        try {
            const scope = await this.getScope(req);
            if (scope.accessLevel !== AccessLevel.FULL) {
                return this.forbidden(res, "Only administrators can delete breaks");
            }

            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            const data = await this.timetableService.deleteBreak(tenantId, id);
            return res.json(data);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
