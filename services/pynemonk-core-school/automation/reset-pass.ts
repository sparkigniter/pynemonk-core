import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    database: 'pynemonk_core',
    password: 'password',
    port: 5432
});

async function reset() {
    const email = 'admin@pynemonk.com';
    const password = 'password';
    const hash = await bcrypt.hash(password, 12);
    
    try {
        const res = await pool.query('SELECT id FROM auth.user WHERE email = $1', [email]);
        if (res.rows.length === 0) {
            console.error('User not found');
            return;
        }
        const userId = res.rows[0].id;
        await pool.query('UPDATE auth.user_credential SET password_hash = $1 WHERE user_id = $2', [hash, userId]);
        console.log('✅ Password reset for', email, 'with fresh hash');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

reset();
