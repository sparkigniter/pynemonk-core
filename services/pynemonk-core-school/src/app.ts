import "reflect-metadata";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { router as schoolRouter } from "./module.js";

/**
 * Creates and configures the Express application without starting the HTTP
 * listener. This allows the same app to be embedded inside the monolith or
 * run as a standalone microservice.
 */
export function createApp(opts?: { prefix?: string }): express.Application {
    const app = express();
    const prefix = opts?.prefix ?? "";

    app.use(
        cors({
            origin: (origin, callback) => {
                // Dynamically mirror request origin to allow all origins with credentials enabled
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
        }),
    );

    app.use(bodyParser.json());

    // ── Routes ────────────────────────────────────────────────────────────────
    app.use(prefix, schoolRouter);

    // ── Health check ──────────────────────────────────────────────────────────
    app.get(`${prefix}/health`, (_req, res) => {
        res.json({
            status: "ok",
            service: "pynemonk-core-school",
            timestamp: new Date().toISOString(),
        });
    });

    app.use((_req, res) => {
        res.status(404).json({ success: false, message: "Route not found" });
    });

    return app;
}
