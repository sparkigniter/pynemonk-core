import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'pynemonk_core'
});

async function check() {
    try {
        const tenants = await pool.query("SELECT * FROM auth.tenant");
        const clients = await pool.query("SELECT * FROM auth.client");
        console.log("Tenants:", tenants.rows);
        console.log("Clients:", clients.rows);
    } catch (e) {
        console.error("Check failed:", e);
    } finally {
        await pool.end();
    }
}
check();
