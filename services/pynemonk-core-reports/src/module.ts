import "reflect-metadata";
import { Router } from "express";
import { container } from "tsyringe";
import setupDI from "./di.js";
import reportsRouter from "./api/modules/reports/routes.js";
import QueueWorker from "./api/modules/reports/workers/QueueWorker.js";

import { runMigrations } from "./db/MigrationRunner.js";
import { runSeeders } from "./db/SeederRunner.js";
import pool from "./db/pg-pool.js";

export { runMigrations, runSeeders, pool };

let worker: QueueWorker | null = null;

/**
 * Initializes the reports module.
 * Bootstraps container, runs DB migrations, and kicks off background tasks queue processing.
 */
export async function init(): Promise<void> {
    setupDI();
    
    // Auto-run migrations and seeders on startup
    try {
        await runMigrations(pool);
        await runSeeders(pool);
    } catch (err) {
        console.error("[Reports] Migration/Seeding failed on startup:", err);
    }

    // Start background queue worker
    try {
        worker = container.resolve(QueueWorker);
        worker.start();
        console.log("[Reports] Asynchronous Queue Worker started successfully.");
    } catch (err) {
        console.error("[Reports] Failed to start background queue worker:", err);
    }
}

// Router instance to be mounted by the monolith
export const router = Router();

// Mount all reports routes
router.use(reportsRouter);
export { worker };
