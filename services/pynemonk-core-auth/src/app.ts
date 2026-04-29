import "reflect-metadata";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import oauthRouter from "./api/modules/oauth2/routes.js";
import authRouter from "./api/modules/auth/routes.js";
import tenantRouter from "./api/modules/tenant/routes.js";

/**
 * Creates and configures the Express application without starting the HTTP
 * listener. This allows the same app to be embedded inside the monolith or
 * run as a standalone microservice.
 *
 * @param opts.prefix  Optional path prefix to mount routes under (e.g. "").
 *                     Useful when the monolith already namespaces routes.
 */
export function createApp(opts?: { prefix?: string }): express.Application {
    const app = express();
    const prefix = opts?.prefix ?? "";

    // ── CORS ──────────────────────────────────────────────────────────────────
    const allowedOrigins = (
        process.env.ALLOWED_ORIGINS ??
        "http://localhost:5173,http://localhost:5174,http://localhost:3001,http://localhost:8000"
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

    // ── Middleware ────────────────────────────────────────────────────────────
    app.use(bodyParser.json());

    // ── Routes ────────────────────────────────────────────────────────────────
    app.use(`${prefix}/api/v1/oauth2`, oauthRouter);
    app.use(`${prefix}/api/v1/auth`, authRouter);
    app.use(`${prefix}/api/v1/tenant`, tenantRouter);

    // ── Health check ──────────────────────────────────────────────────────────
    app.get(`${prefix}/health`, (_req, res) => {
        res.json({ status: "ok", service: "pynemonk-core-auth", timestamp: new Date().toISOString() });
    });

    // ── 404 fallback ──────────────────────────────────────────────────────────
    app.use((_req, res) => {
        res.status(404).json({ success: false, message: "Route not found" });
    });

    return app;
}
