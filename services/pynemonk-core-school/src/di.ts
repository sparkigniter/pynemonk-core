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
import TeacherHelper from "./api/modules/staff/helpers/TeacherHelper.js";
import TeacherController from "./api/modules/staff/controllers/TeacherController.js";
import ClassroomHelper from "./api/modules/classroom/helpers/ClassroomHelper.js";
import ClassroomService from "./api/modules/classroom/services/ClassroomService.js";
import ClassroomController from "./api/modules/classroom/controllers/ClassroomController.js";
import AdmissionService from "./api/modules/admission/services/AdmissionService.js";
import AdmissionWorkflowService from "./api/modules/admission/services/AdmissionWorkflowService.js";
import AdmissionController from "./api/modules/admission/controllers/AdmissionController.js";
import RoleService from "./api/modules/staff/services/RoleService.js";
import RoleController from "./api/modules/staff/controllers/RoleController.js";
import CourseHelper from "./api/modules/course/helpers/CourseHelper.js";
import CourseService from "./api/modules/course/services/CourseService.js";
import CourseController from "./api/modules/course/controllers/CourseController.js";
import EnrollmentHelper from "./api/modules/student/helpers/EnrollmentHelper.js";
import GuardianHelper from "./api/modules/guardian/helpers/GuardianHelper.js";
import GuardianController from "./api/modules/guardian/controllers/GuardianController.js";
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
import DashboardService from "./api/modules/dashboard/services/DashboardService.js";
import DashboardController from "./api/modules/dashboard/controllers/DashboardController.js";
import AttendanceService from "./api/modules/attendance/services/AttendanceService.js";
import AttendanceController from "./api/modules/attendance/controllers/AttendanceController.js";
import { TeacherNoteHelper } from "./api/modules/teacher-note/helpers/TeacherNoteHelper.js";
import { TeacherNoteService } from "./api/modules/teacher-note/services/TeacherNoteService.js";
import { TeacherNoteController } from "./api/modules/teacher-note/controllers/TeacherNoteController.js";
import { IntegrationRegistry } from "./api/modules/integration/core/IntegrationRegistry.js";
import { IntegrationService } from "./api/modules/integration/services/IntegrationService.js";
import IntegrationHelper from "./api/modules/integration/helpers/IntegrationHelper.js";
import { PluginContextFactory } from "./api/modules/integration/core/PluginContextFactory.js";
import { KarnatakaSATSAdapter } from "./api/modules/integration/plugins/karnataka-sats/SATSAdapter.js";
import NotificationService from "./api/modules/notification/services/NotificationService.js";
import { EmailDispatcher, SMSDispatcher, InAppDispatcher } from "./api/modules/notification/dispatchers/MockDispatchers.js";

import LeaveHelper from "./api/modules/leave/helpers/LeaveHelper.js";
import LeaveService from "./api/modules/leave/services/LeaveService.js";
import LeaveController from "./api/modules/leave/controllers/LeaveController.js";
import PayrollHelper from "./api/modules/payroll/helpers/PayrollHelper.js";
import PayrollService from "./api/modules/payroll/services/PayrollService.js";
import PayrollController from "./api/modules/payroll/controllers/PayrollController.js";

import { EventEmitter } from "events";

function setupDI(): void {
    // ── Infrastructure ──────────────────────────────────────────────────────
    container.registerInstance("DB", pool);
    if (!container.isRegistered("EventBus")) {
        container.registerInstance("EventBus", new EventEmitter());
    }
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
    container.register(TeacherHelper, { useClass: TeacherHelper });
    container.register(TeacherController, { useClass: TeacherController });

    // ── Classroom Module ────────────────────────────────────────────────────
    container.register(ClassroomHelper, { useClass: ClassroomHelper });
    container.register(ClassroomService, { useClass: ClassroomService });
    container.register(ClassroomController, { useClass: ClassroomController });

    // ── Admission Module ────────────────────────────────────────────────────
    container.register(EnrollmentHelper, { useClass: EnrollmentHelper });
    container.register(GuardianHelper, { useClass: GuardianHelper });
    container.register(GuardianController, { useClass: GuardianController });
    container.register(AdmissionService, { useClass: AdmissionService });
    container.register(AdmissionWorkflowService, { useClass: AdmissionWorkflowService });
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

    // ── Dashboard Module ─────────────────────────────────────────────────────
    container.register(DashboardService, {
        useFactory: (c) => new DashboardService(
            c.resolve("DB"),
            c.resolve(AcademicYearHelper)
        )
    });
    container.register(DashboardController, {
        useFactory: (c) => new DashboardController(c.resolve(DashboardService)),
    });

    // ── Attendance Module ───────────────────────────────────────────────────
    container.register(AttendanceService, {
        useFactory: (c) => new AttendanceService(c.resolve("DB"))
    });
    container.register(AttendanceController, {
        useFactory: (c) => new AttendanceController(c.resolve(AttendanceService))
    });

    // ── Teacher Note Module ─────────────────────────────────────────────────
    container.register(TeacherNoteHelper, { useClass: TeacherNoteHelper });
    container.register(TeacherNoteService, { useClass: TeacherNoteService });
    container.register(TeacherNoteController, { useClass: TeacherNoteController });

    // ── Integration Hub ──────────────────────────────────────────────────────
    container.register(IntegrationHelper, { useClass: IntegrationHelper });
    container.registerSingleton(IntegrationRegistry);
    container.register(PluginContextFactory, { useClass: PluginContextFactory });
    container.register(IntegrationService, { useClass: IntegrationService });

    // Register Plugins
    const registry = container.resolve(IntegrationRegistry);
    registry.register(container.resolve(KarnatakaSATSAdapter));

    // ── Notification Module ──────────────────────────────────────────────────
    container.register("NotificationDispatcher", { useClass: EmailDispatcher });
    container.register("NotificationDispatcher", { useClass: SMSDispatcher });
    container.register("NotificationDispatcher", { useClass: InAppDispatcher });
    container.registerSingleton(NotificationService);

    // ── Leave Module ─────────────────────────────────────────────────────────
    container.register(LeaveHelper, { useClass: LeaveHelper });
    container.register(LeaveService, { useClass: LeaveService });
    container.register(LeaveController, { useClass: LeaveController });

    // ── Payroll Module ───────────────────────────────────────────────────────
    container.register(PayrollHelper, { useClass: PayrollHelper });
    container.register(PayrollService, { useClass: PayrollService });
    container.register(PayrollController, { useClass: PayrollController });
}

export default setupDI;
