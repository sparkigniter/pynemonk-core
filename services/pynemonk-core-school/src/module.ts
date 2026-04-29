import { container } from "tsyringe";
import "reflect-metadata";
import { Router } from "express";
import setupDI from "./di.js";
import studentRouter from "./api/modules/student/routes.js";
import staffRouter from "./api/modules/staff/routes.js";
import classroomRouter from "./api/modules/classroom/routes.js";
import admissionRouter from "./api/modules/admission/routes.js";
import courseRouter from "./api/modules/course/routes.js";
import subjectRouter from "./api/modules/subject/routes.js";
import gradeRouter from "./api/modules/grade/routes.js";
import timetableRouter from "./api/modules/timetable/routes.js";
import academicsRouter from "./api/modules/academics/routes.js";
import examRouter from "./api/modules/exam/routes.js";
import eventRouter from "./api/modules/event/routes.js";
import workflowRouter from "./api/modules/workflow/routes.js";
import dashboardRouter from "./api/modules/dashboard/routes.js";
import attendanceRouter from "./api/modules/attendance/routes.js";
import teacherNoteRouter from "./api/modules/teacher-note/routes.js";
import integrationRouter from "./api/modules/integration/routes.js";
import { AcademicYearMiddleware } from "./api/core/middleware/AcademicYearMiddleware.js";
import { requireAuth } from "./api/core/middleware/requireAuth.js";

import { runMigrations } from "./db/MigrationRunner.js";
import pool from "./db/pg-pool.js";
export { runMigrations, pool };

export async function init(): Promise<void> {
    setupDI();
    // Migrations are now managed via CLI tool: npm run migrate
    // await runMigrations(pool);
}

export const router = Router();
const academicYearMiddleware = container.resolve(AcademicYearMiddleware);

// Ensure all school routes are authenticated
router.use(requireAuth);

// Protect closed academic years from modifications
router.use(academicYearMiddleware.protectClosedYear.bind(academicYearMiddleware));

// Mount all school sub-routers under /school/...
router.use("/school/students", studentRouter);
router.use("/school/staff", staffRouter);
router.use("/school/classrooms", classroomRouter);
router.use("/school/admissions", admissionRouter);
router.use("/school/courses", courseRouter);
router.use("/school/subjects", subjectRouter);
router.use("/school/grades", gradeRouter);
router.use("/school/timetable", timetableRouter);
router.use("/school/academics", academicsRouter);
router.use("/school/exams", examRouter);
router.use("/school/events", eventRouter);
router.use("/school/workflows", workflowRouter);
router.use("/school/dashboard", dashboardRouter);
router.use("/school/attendance", attendanceRouter);
router.use("/school/teacher-notes", teacherNoteRouter);
router.use("/school/integrations", integrationRouter);

// router.use("/school/classrooms", classroomRouter);
