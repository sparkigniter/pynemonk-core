import { container } from "tsyringe";
import "reflect-metadata";
import { Router } from "express";
import { setupDI } from "./di/setup.js";
import systemRouter from "./api/modules/system/routes.js";

export async function init(): Promise<void> {
    setupDI();
}

export const router = Router();
router.use("/system", systemRouter);
