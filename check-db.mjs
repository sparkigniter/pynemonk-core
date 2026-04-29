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
        const res = await pool.query(`
            SELECT 
                s.first_name as student_name,
                c.name as classroom_name,
                g.name as grade_name,
                p.email as parent_email
            FROM school.student s
            JOIN school.student_enrollment se ON s.id = se.student_id
            JOIN school.classroom c ON se.classroom_id = c.id
            JOIN school.grade g ON c.grade_id = g.id
            JOIN school.student_guardian sg ON s.id = sg.student_id
            JOIN school.guardian p ON sg.guardian_id = p.id
            WHERE g.name = 'Grade 1' AND c.name LIKE '%1-A%'
            LIMIT 1
        `);
        console.log("Grade 1 Parent:", res.rows);
        console.log("Grade 1 Parents:", res.rows);
    } catch (e) {
        console.error("Check failed:", e);
    } finally {
        await pool.end();
    }
}
check();
