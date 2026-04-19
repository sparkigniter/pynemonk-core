import "reflect-metadata";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import { container } from "tsyringe";


// ── Module imports ────────────────────────────────────────────────────────────
// Each service exposes { init, router } from its module.ts.
// To add a new service: import it here, call init(), mount router.
import * as authModule from "pynemonk-core-auth/module";
import * as schoolModule from "pynemonk-core-school/module";
import * as accountingModule from "pynemonk-core-accounting/module";
// import * as notifyModule  from "pynemonk-core-notifications/module";

// ── Bootstrap ─────────────────────────────────────────────────────────────────
dotenv.config();

// Initialize Global Event Bus for inter-module communication
const eventBus = new EventEmitter();
container.registerInstance("EventBus", eventBus);

// Initialize each module (sets up DI, DB pools, etc.)

await authModule.init();
await schoolModule.init();
await accountingModule.init();
// notifyModule.init();

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ??
    "http://localhost:5173,http://localhost:5174"
)
    .split(",")
    .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) callback(null, true);
            else callback(new Error(`CORS: origin '${origin}' not allowed`));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    })
);

app.use(bodyParser.json());

// ── Mount service routers ─────────────────────────────────────────────────────
// All modules share the same /api/v1 namespace via a unified router.
app.use("/api/v1", authModule.router);
app.use("/api/v1", schoolModule.router);
app.use("/api/v1", accountingModule.router);
// app.use("/api/v1", notifyModule.router);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        mode: "monolith",
        modules: [
            "pynemonk-core-auth",
            "pynemonk-core-school",
            "pynemonk-core-accounting",
            // "pynemonk-core-notifications",
        ],
        timestamp: new Date().toISOString(),
    });
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[pynemonk-monolith] running → http://localhost:${PORT}`);
    console.log("[pynemonk-monolith] loaded modules: pynemonk-core-auth");
    console.log("");
    console.log("  Auth routes:");
    console.log("    POST /api/v1/auth/register");
    console.log("    POST /api/v1/auth/login");
    console.log("    POST /api/v1/auth/refresh");
    console.log("    POST /api/v1/auth/logout");
    console.log("    POST /api/v1/auth/introspect");
    console.log("  OAuth2 routes:");
    console.log("    POST /api/v1/oauth2/token");
    console.log("    POST /api/v1/oauth2/client");
    console.log("    GET  /api/v1/oauth2/client");
    console.log("    POST /api/v1/oauth2/scope");
    console.log("    GET  /api/v1/oauth2/scope");
    console.log("    POST /api/v1/oauth2/client-scope");
    console.log("  GET  /health");
    console.log("");
    console.log("  School routes:");
    console.log("    GET|POST /api/v1/school/students");
    console.log("  Accounting routes:");
    console.log("    GET|POST /api/v1/accounting/fees/categories");
});
