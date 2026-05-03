import { inject, injectable } from "tsyringe";
import type CreateClientRequest from "../dtos/requests/CreateClientRequest.js";

@injectable()
class OauthClientHelper {

  protected db: any; // Replace with actual database connection type

  constructor(@inject("DB") DB: any) {
    // Initialize any necessary properties or dependencies
    this.db = DB;
  }

  public async createClient(client: CreateClientRequest): Promise<any> {
    const query = `
        INSERT INTO auth.client (
          name, 
          description, 
          client_id, 
          client_secret, 
          is_deleted, 
          created_at, 
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7
        ) RETURNING id, name, description, client_id, created_at, updated_at;`;

    const values = [
      client.name,
      client.description,
      client.client_id,
      client.client_secret,
      false,
      new Date(),
      new Date()
    ];

    const res = await this.db.query(query, values);
    console.log("Client created with ID:", res.rows);
    return res;

  }

  public async getAllClients() {
    const res = await this.db.query(`SELECT id, name, description, client_id, is_active, created_at, updated_at FROM auth.client`);
    return res;
  }

  public async getClientByName(name: string) {
    const res = await this.db.query(`SELECT id, name, description, client_id, is_active, created_at, updated_at FROM auth.client WHERE name = $1`, [name]);
    return res.rows[0];
  }

  public async getClientById(clientId: string) {
    const res = await this.db.query(`SELECT id, name, description, client_id, client_secret, is_active, created_at, updated_at FROM auth.client WHERE client_id = $1`, [clientId]);
    return res.rows[0];
  }

  public async getClientSecret(clientId: string) {
    const res = await this.db.query(`SELECT client_secret FROM auth.client WHERE client_id = $1`, [clientId]);
    if (res.rows.length === 0) {
      throw new Error("Client not found");
    }
    return res.rows[0].client_secret;
  }

  public async getClientScopes(clientId: string): Promise<string[]> {
    const query = `
        SELECT s.value
        FROM auth.scope s
        JOIN auth.client_scope cs ON s.id = cs.scope_id
        JOIN auth.client c ON cs.client_id = c.id
        WHERE c.client_id = $1 AND cs.is_deleted = FALSE;
    `;
    const res = await this.db.query(query, [clientId]);
    return res.rows.map((r: any) => r.value);
  }

  public async getClientRoles(clientId: string): Promise<string[]> {
    const query = `
        SELECT r.slug
        FROM auth.role r
        JOIN auth.client_role cr ON r.id = cr.role_id
        JOIN auth.client c ON cr.client_id = c.id
        WHERE c.client_id = $1 AND r.is_deleted = FALSE;
    `;
    const res = await this.db.query(query, [clientId]);
    return res.rows.map((r: any) => r.slug);
  }

  public async isRoleAllowed(clientId: string, roleSlugs: string[]): Promise<boolean> {
    // 1. SuperAdmin Override: system_admin is allowed everywhere
    if (roleSlugs.includes('system_admin')) return true;

    // 2. Client-Role Tagging: check if any roles are explicitly restricted
    const allowedRoles = await this.getClientRoles(clientId);
    if (allowedRoles.length === 0) return true; // Open if no restrictions defined
    
    return roleSlugs.some(slug => allowedRoles.includes(slug));
  }
}

export default OauthClientHelper;