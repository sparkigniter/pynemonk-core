import "reflect-metadata";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

/**
 * Creates and configures the Express application without starting the HTTP
 * listener. This allows the same app to be embedded inside the monolith or
 * run as a standalone microservice.
 */
export function createApp(opts?: { prefix?: string }): express.Application {
    const app = express();
    const prefix = opts?.prefix ?? "";

    const allowedOrigins = (
        process.env.ALLOWED_ORIGINS ??
        "http://localhost:5173,http://localhost:5174,http://localhost:3001"
    )
        .split(",")
        .map((o) => o.trim());

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
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        })
    );

    app.use(bodyParser.json());

    // ── Routes (To be added later) ────────────────────────────────────────────

    // ── Health check ──────────────────────────────────────────────────────────
    app.get(`${prefix}/health`, (_req, res) => {
        res.json({ status: "ok", service: "pynemonk-core-accounting", timestamp: new Date().toISOString() });
    });

    app.use((_req, res) => {
        res.status(404).json({ success: false, message: "Route not found" });
    });

    return app;
}
