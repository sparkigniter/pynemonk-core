import "reflect-metadata";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import reportsRouter from "./api/modules/reports/routes.js";

/**
 * Creates and configures the Express application forstandalone microservice running.
 */
export function createApp(opts?: { prefix?: string }): express.Application {
    const app = express();
    const prefix = opts?.prefix ?? "";

    app.use(
        cors({
            origin: (origin, callback) => {
                callback(null, true);
            },
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: [
                "Content-Type", 
                "Authorization", 
                "x-academic-year-id", 
                "Accept", 
                "X-Requested-With",
                "x-tenant-id"
            ],
            credentials: true,
        })
    );

    app.use(bodyParser.json());

    // ── Routes ──────────────────────────────────────────────────────────────
    app.use(`${prefix}`, reportsRouter);

    // ── Health check ──────────────────────────────────────────────────────────
    app.get(`${prefix}/reports-health`, (_req, res) => {
        res.json({ 
            status: "ok", 
            service: "pynemonk-core-reports", 
            timestamp: new Date().toISOString() 
        });
    });

    app.use((_req, res) => {
        res.status(404).json({ success: false, message: "Route not found" });
    });

    return app;
}
