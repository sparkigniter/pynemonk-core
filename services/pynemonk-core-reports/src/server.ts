import dotenv from "dotenv";
import { createApp } from "./app.js";
import { init } from "./module.js";

dotenv.config();

// Initialize service, run migrations/seeders, start background queue worker
init();

const PORT = process.env.REPORTS_PORT || 3005;
const app = createApp();

app.listen(PORT, () => {
    console.log(`[pynemonk-core-reports] running → http://localhost:${PORT}`);
});
