import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432"),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "password",
    database: process.env.PGDATABASE || "pynemonk_core",
    ssl: (process.env.PGSSL === "true" || 
          (process.env.PGHOST && 
           !process.env.PGHOST.includes("localhost") && 
           !process.env.PGHOST.includes("db") && 
           !process.env.PGHOST.includes("postgres") &&
           process.env.PGSSL !== "false"))
        ? { rejectUnauthorized: false }
        : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export default pool;
