const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres@localhost:5432/pynemonk_core' });

async function run() {
  const query = `
            WITH user_info AS (
                SELECT u.id, u.tenant_id, u.email, uc.password_hash 
                FROM auth.user u 
                JOIN auth.user_credential uc ON u.id = uc.user_id
                WHERE u.email = $1 AND u.is_deleted = FALSE
            ),
            all_user_roles AS (
                SELECT r.id as role_id, r.tenant_id, r.slug
                FROM auth.user_role ur
                JOIN auth.role r ON ur.role_id = r.id
                WHERE ur.user_id = (SELECT id FROM user_info) AND ur.is_deleted = FALSE
                UNION
                SELECT r.id as role_id, r.tenant_id, r.slug
                FROM auth.user u
                JOIN auth.role r ON u.role_id = r.id
                WHERE u.id = (SELECT id FROM user_info) AND u.is_deleted = FALSE
            ),
            effective_permissions AS (
                SELECT s.value
                FROM auth.client_role_scope crs
                JOIN auth.scope s ON crs.scope_id = s.id
                JOIN auth.client c ON crs.client_id = c.id
                WHERE crs.role_id IN (SELECT role_id FROM all_user_roles)
                  AND c.client_id = $2
                  AND crs.granted = TRUE
            )
            SELECT ARRAY_AGG(DISTINCT value) as permissions FROM effective_permissions;
  `;
  const res = await pool.query(query, ['teacher1@demo.edu', '03458d1b77bf121e']);
  console.log("Permissions for web frontend client:", res.rows[0].permissions);
  pool.end();
}
run();
