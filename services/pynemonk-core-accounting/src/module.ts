import "reflect-metadata";
import { Router } from "express";
import { container } from "tsyringe";
import setupDI from "./di.js";
import feeRouter from "./api/modules/fee/routes.js";
import accountsRouter from "./api/modules/accounts/routes.js";

import AccountingAutomationSubscriber from "./api/modules/accounts/subscribers/AccountingAutomationSubscriber.js";


import { runMigrations } from "./db/MigrationRunner.js";
import { runSeeders } from "./db/SeederRunner.js";
import pool from "./db/pg-pool.js";
export { runMigrations, runSeeders, pool };

export async function init(): Promise<void> {
    setupDI();
    
    // Auto-run migrations and seeders on startup
    try {
        await runMigrations(pool);
        await runSeeders(pool);
    } catch (err) {
        console.error("[Accounting] Migration/Seeding failed on startup:", err);
    }


    // Start listeners

    container.resolve(AccountingAutomationSubscriber).init();
}


export const router = Router();

// Mount all accounting sub-routers under /accounting/...
router.use("/accounting/fees", feeRouter);
router.use("/accounting", accountsRouter); // This will handle /accounting/coa, /accounting/journals etc.
