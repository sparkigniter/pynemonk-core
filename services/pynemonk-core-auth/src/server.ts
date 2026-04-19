import "reflect-metadata";
import dotenv from "dotenv";
import setupDI from "./di.js";
import { createApp } from "./app.js";

// Load env vars first so JWT secrets, DB config, etc. are available
dotenv.config();

// Boot DI container
setupDI();

const app = createApp();
const PORT = parseInt(process.env.PORT ?? "3001", 10) || 3001;

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[pynemonk-core-auth] standalone → http://localhost:${PORT}`);
    console.log(`[pynemonk-core-auth] CORS: ${process.env.ALLOWED_ORIGINS ?? "(defaults)"}`);
    console.log("Routes:");
    console.log("  POST /api/v1/auth/register");
    console.log("  POST /api/v1/auth/login");
    console.log("  POST /api/v1/auth/refresh");
    console.log("  POST /api/v1/auth/logout  (requires Bearer token)");
    console.log("  POST /api/v1/auth/introspect");
    console.log("  POST /api/v1/oauth2/token");
    console.log("  POST /api/v1/oauth2/client");
    console.log("  GET  /api/v1/oauth2/client");
    console.log("  POST /api/v1/oauth2/scope");
    console.log("  GET  /api/v1/oauth2/scope");
    console.log("  POST /api/v1/oauth2/client-scope");
    console.log("  GET  /health");
});
