import dotenv from "dotenv";
import { createApp } from "./app.js";
import { init } from "./module.js";

dotenv.config();

init();

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
    console.log(`[pynemonk-core-school] running → http://localhost:${PORT}`);
});
