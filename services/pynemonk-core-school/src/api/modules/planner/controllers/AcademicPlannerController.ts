import { Request, Response } from 'express';
import { injectable } from 'tsyringe';
import BaseController from '../../../core/controllers/BaseController.js';
import { AcademicPlannerService } from '../services/AcademicPlannerService.js';

@injectable()
export class AcademicPlannerController extends BaseController {
    constructor(private service: AcademicPlannerService) {
        super();
    }

    async listPlanners(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const planners = await this.service.listPlanners(tenantId, req.query);
            return this.ok(res, "Planners retrieved", planners);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getPlannerByTeacherAndSubject(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const staffId = parseInt(req.query.staff_id as string);
            const subjectId = parseInt(req.query.subject_id as string);
            const gradeId = parseInt(req.query.grade_id as string);
            const academicYearId = req.query.academic_year_id ? parseInt(req.query.academic_year_id as string) : undefined;

            if (!staffId || !subjectId || !gradeId) {
                return this.badrequest(res, "Missing parameters");
            }

            const planner = await this.service.getPlannerByTeacherAndSubject(tenantId, staffId, subjectId, gradeId, academicYearId);
            return this.ok(res, "Planner retrieved", planner);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async createPlanner(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const planner = await this.service.createPlanner(tenantId, req.body);
            return this.ok(res, "Planner created successfully", planner);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async getPlannerDetails(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return this.badrequest(res, "Invalid planner ID");
            }
            const details = await this.service.getPlannerDetails(tenantId, id);
            if (!details) return this.notfound(res, "Planner not found");
            return this.ok(res, "Planner details retrieved", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async addChapter(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            if (isNaN(plannerId)) {
                return this.badrequest(res, "Invalid planner ID");
            }
            const chapter = await this.service.addChapter(tenantId, plannerId, req.body);
            return this.ok(res, "Chapter added successfully", chapter);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async updateChapter(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const chapterId = parseInt(req.params.id);
            if (isNaN(chapterId)) {
                return this.badrequest(res, "Invalid chapter ID");
            }
            const chapter = await this.service.updateChapter(tenantId, chapterId, req.body);
            return this.ok(res, "Chapter updated successfully", chapter);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async addMilestone(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            if (isNaN(plannerId)) {
                return this.badrequest(res, "Invalid planner ID");
            }
            const milestone = await this.service.addMilestone(tenantId, plannerId, req.body);
            return this.ok(res, "Milestone added successfully", milestone);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async autoSchedulePlanner(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            if (isNaN(plannerId)) {
                return this.badrequest(res, "Invalid planner ID");
            }
            const details = await this.service.autoSchedulePlanner(tenantId, plannerId);
            return this.ok(res, "Planner scheduled successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async importGlobalSyllabus(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const plannerId = parseInt(req.params.id);
            const globalSyllabusId = parseInt(req.body.global_syllabus_id);
            if (isNaN(plannerId) || isNaN(globalSyllabusId)) {
                return this.badrequest(res, "Missing or invalid planner ID / global syllabus ID");
            }
            const details = await this.service.importGlobalSyllabus(tenantId, plannerId, globalSyllabusId);
            return this.ok(res, "Global syllabus imported successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async deleteChapter(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const chapterId = parseInt(req.params.id);
            if (isNaN(chapterId)) {
                return this.badrequest(res, "Invalid chapter ID");
            }
            const details = await this.service.deleteChapter(tenantId, chapterId);
            return this.ok(res, "Chapter deleted successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async moveChapter(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const chapterId = parseInt(req.params.id);
            const direction = req.body.direction; // 'up' or 'down'
            if (isNaN(chapterId) || (direction !== 'up' && direction !== 'down')) {
                return this.badrequest(res, "Invalid parameters");
            }
            const details = await this.service.moveChapter(tenantId, chapterId, direction);
            return this.ok(res, "Chapter moved successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async addTopic(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const chapterId = parseInt(req.params.chapterId);
            if (isNaN(chapterId) || !req.body.title) {
                return this.badrequest(res, "Missing or invalid parameters");
            }
            const topic = await this.service.addTopic(tenantId, chapterId, req.body);
            return this.ok(res, "Topic added successfully", topic);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async updateTopic(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const topicId = parseInt(req.params.id);
            if (isNaN(topicId)) {
                return this.badrequest(res, "Invalid topic ID");
            }
            const topic = await this.service.updateTopic(tenantId, topicId, req.body);
            return this.ok(res, "Topic updated successfully", topic);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async deleteTopic(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const topicId = parseInt(req.params.id);
            if (isNaN(topicId)) {
                return this.badrequest(res, "Invalid topic ID");
            }
            const details = await this.service.deleteTopic(tenantId, topicId);
            return this.ok(res, "Topic deleted successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }

    async moveTopic(req: Request, res: Response) {
        try {
            const tenantId = this.getTenantId(req);
            const topicId = parseInt(req.params.id);
            const direction = req.body.direction; // 'up' or 'down'
            if (isNaN(topicId) || (direction !== 'up' && direction !== 'down')) {
                return this.badrequest(res, "Invalid parameters");
            }
            const details = await this.service.moveTopic(tenantId, topicId, direction);
            return this.ok(res, "Topic moved successfully", details);
        } catch (error: any) {
            return this.internalservererror(res, error.message);
        }
    }
}
