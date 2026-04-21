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

import { runMigrations } from "./db/MigrationRunner.js";
import pool from "./db/pg-pool.js";
export { runMigrations, pool };

export async function init(): Promise<void> {
    setupDI();
    // Migrations are now managed via CLI tool: npm run migrate
}

export const router = Router();

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

// router.use("/school/classrooms", classroomRouter);
