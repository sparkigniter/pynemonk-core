import "reflect-metadata";
import { Router } from "express";
import { container } from "tsyringe";
import setupDI from "./di.js";
import feeRouter from "./api/modules/fee/routes.js";
import FeeAdmissionListener from "./api/modules/fee/listeners/FeeAdmissionListener.js";


import { runMigrations } from "./db/MigrationRunner.js";
import pool from "./db/pg-pool.js";
export { runMigrations, pool };

export async function init(): Promise<void> {
    setupDI();
    // Migrations are now managed via CLI tool: npm run migrate
    // Start listeners
    container.resolve(FeeAdmissionListener);
}

export const router = Router();

// Mount all accounting sub-routers under /accounting/...
router.use("/accounting/fees", feeRouter);
// router.use("/accounting/payments", paymentRouter);
