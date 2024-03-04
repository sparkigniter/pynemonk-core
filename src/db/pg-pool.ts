import { Pool } from 'pg';

const pool = new Pool({
    host: 'postgres',
    user: 'postgres',
    password: '@forsaken123',
    database: 'pynemonk_core',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export default pool;
