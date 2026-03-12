import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
    host: 'postgres',
    user: 'postgres',
    password: 'password',
    database: 'pynemonk_core',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default pool;
