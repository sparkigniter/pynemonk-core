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

    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ];

    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS: origin '${origin}' not allowed`));
                }
            },
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "x-academic-year-id", "Accept", "X-Requested-With"],
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
