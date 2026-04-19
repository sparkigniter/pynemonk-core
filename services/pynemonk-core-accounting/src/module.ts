import "reflect-metadata";
import { Router } from "express";
import { container } from "tsyringe";
import setupDI from "./di.js";
import feeRouter from "./api/modules/fee/routes.js";
import FeeAdmissionListener from "./api/modules/fee/listeners/FeeAdmissionListener.js";


export async function init(): Promise<void> {
    setupDI();
    // Start listeners
    container.resolve(FeeAdmissionListener);
}

export const router = Router();

// Mount all accounting sub-routers under /accounting/...
router.use("/accounting/fees", feeRouter);
// router.use("/accounting/payments", paymentRouter);
