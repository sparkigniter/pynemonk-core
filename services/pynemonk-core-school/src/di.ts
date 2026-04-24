import "reflect-metadata";
import { container } from "tsyringe";
import pool from "./db/pg-pool.js";

import StudentHelper from "./api/modules/student/helpers/StudentHelper.js";
import StudentValidator from "./api/modules/student/validator/StudentValidator.js";
import StudentService from "./api/modules/student/services/StudentService.js";
import StudentController from "./api/modules/student/controllers/StudentController.js";
import StaffHelper from "./api/modules/staff/helpers/StaffHelper.js";
import StaffValidator from "./api/modules/staff/validator/StaffValidator.js";
import StaffService from "./api/modules/staff/services/StaffService.js";
import StaffController from "./api/modules/staff/controllers/StaffController.js";
import ClassroomHelper from "./api/modules/classroom/helpers/ClassroomHelper.js";
import ClassroomService from "./api/modules/classroom/services/ClassroomService.js";
import ClassroomController from "./api/modules/classroom/controllers/ClassroomController.js";
import AdmissionService from "./api/modules/admission/services/AdmissionService.js";
import AdmissionController from "./api/modules/admission/controllers/AdmissionController.js";
import RoleService from "./api/modules/staff/services/RoleService.js";
import RoleController from "./api/modules/staff/controllers/RoleController.js";
import CourseHelper from "./api/modules/course/helpers/CourseHelper.js";
import CourseService from "./api/modules/course/services/CourseService.js";
import CourseController from "./api/modules/course/controllers/CourseController.js";
import EnrollmentHelper from "./api/modules/student/helpers/EnrollmentHelper.js";
import GuardianHelper from "./api/modules/guardian/helpers/GuardianHelper.js";
import { GradeService } from "./api/modules/grade/services/GradeService.js";
import { GradeController } from "./api/modules/grade/controllers/GradeController.js";
import AcademicYearHelper from "./api/modules/academics/helpers/AcademicYearHelper.js";
import RolloverService from "./api/modules/academics/services/RolloverService.js";
import RolloverController from "./api/modules/academics/controllers/RolloverController.js";

import { TimetableService } from "./api/modules/timetable/services/TimetableService.js";
import { TimetableController } from "./api/modules/timetable/controllers/TimetableController.js";
import { ExamHelper } from "./api/modules/exam/helpers/ExamHelper.js";
import { ExamService } from "./api/modules/exam/services/ExamService.js";
import { ExamController } from "./api/modules/exam/controllers/ExamController.js";
import { WorkflowHelper } from "./api/modules/workflow/helpers/WorkflowHelper.js";
import { WorkflowService } from "./api/modules/workflow/services/WorkflowService.js";
import { WorkflowController } from "./api/modules/workflow/controllers/WorkflowController.js";

import { InternalAuthClient } from "./api/core/clients/InternalAuthClient.js";
import { EventService } from "./api/modules/event/services/EventService.js";
import EventController from "./api/modules/event/controllers/EventController.js";

import { EventEmitter } from "events";

function setupDI(): void {
    // ── Infrastructure ──────────────────────────────────────────────────────
    container.registerInstance("DB", pool);
    container.registerInstance("EventBus", new EventEmitter());
    container.register("IAuthClient", { useClass: InternalAuthClient });

    // ── Student Module ──────────────────────────────────────────────────────
    container.register(StudentHelper, { useClass: StudentHelper });
    container.register(StudentValidator, { useClass: StudentValidator });
    container.register(StudentService, { useClass: StudentService });
    container.register(StudentController, { useClass: StudentController });

    // ── Staff Module ────────────────────────────────────────────────────────
    container.register(StaffHelper, { useClass: StaffHelper });
    container.register(StaffValidator, { useClass: StaffValidator });
    container.register(StaffService, { useClass: StaffService });
    container.register(StaffController, { useClass: StaffController });

    // ── Classroom Module ────────────────────────────────────────────────────
    container.register(ClassroomHelper, { useClass: ClassroomHelper });
    container.register(ClassroomService, { useClass: ClassroomService });
    container.register(ClassroomController, { useClass: ClassroomController });

    // ── Admission Module ────────────────────────────────────────────────────
    container.register(EnrollmentHelper, { useClass: EnrollmentHelper });
    container.register(GuardianHelper, { useClass: GuardianHelper });
    container.register(AdmissionService, { useClass: AdmissionService });
    container.register(AdmissionController, { useClass: AdmissionController });

    // ── Role Management ──────────────────────────────────────────────────────
    container.register(RoleService, { useClass: RoleService });
    container.register(RoleController, { useClass: RoleController });

    // ── Course Module ────────────────────────────────────────────────────────
    container.register(CourseHelper, { useClass: CourseHelper });
    container.register(CourseService, { useClass: CourseService });
    container.register(CourseController, { useClass: CourseController });

    // ── Grade Module ─────────────────────────────────────────────────────────
    container.register(GradeService, { useClass: GradeService });
    container.register(GradeController, { useClass: GradeController });

    // ── Timetable Module ─────────────────────────────────────────────────────
    container.register(TimetableService, { useClass: TimetableService });
    container.register(TimetableController, { useClass: TimetableController });

    // ── Academics Module ─────────────────────────────────────────────────────
    container.register(AcademicYearHelper, { useClass: AcademicYearHelper });
    container.register(RolloverService, { useClass: RolloverService });
    container.register(RolloverController, { useClass: RolloverController });
    container.register("AcademicYearHelper", { useClass: AcademicYearHelper }); // Alias for legacy usage

    // ── Exam Module ──────────────────────────────────────────────────────────
    container.register(ExamHelper, { useClass: ExamHelper });
    container.register(ExamService, { useClass: ExamService });
    container.register(ExamController, { useClass: ExamController });

    // ── Workflow Module ──────────────────────────────────────────────────────
    container.register(WorkflowHelper, { useClass: WorkflowHelper });
    container.register(WorkflowService, { useClass: WorkflowService });
    container.register(WorkflowController, { useClass: WorkflowController });

    // ── Event Module ─────────────────────────────────────────────────────────
    container.register(EventService, { useClass: EventService });
    container.register(EventController, { useClass: EventController });
}

export default setupDI;
