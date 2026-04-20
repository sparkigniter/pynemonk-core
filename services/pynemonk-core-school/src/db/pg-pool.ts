import pkg from "pg";
const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432"),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "password",
    database: process.env.PGDATABASE || "pynemonk_core",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export default pool;
