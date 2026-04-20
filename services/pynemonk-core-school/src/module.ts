import "reflect-metadata";
import { Router } from "express";
import setupDI from "./di.js";
import studentRouter from "./api/modules/student/routes.js";
import staffRouter from "./api/modules/staff/routes.js";
import classroomRouter from "./api/modules/classroom/routes.js";
import admissionRouter from "./api/modules/admission/routes.js";
import courseRouter from "./api/modules/course/routes.js";
import gradeRouter from "./api/modules/grade/routes.js";

import pool from "./db/pg-pool.js";
import { runMigrations } from "./db/MigrationRunner.js";

export async function init(): Promise<void> {
    setupDI();
    await runMigrations(pool);
}

export const router = Router();

// Mount all school sub-routers under /school/...
router.use("/school/students", studentRouter);
router.use("/school/staff", staffRouter);
router.use("/school/classrooms", classroomRouter);
router.use("/school/admissions", admissionRouter);
router.use("/school/courses", courseRouter);
router.use("/school/grades", gradeRouter);

// router.use("/school/classrooms", classroomRouter);
