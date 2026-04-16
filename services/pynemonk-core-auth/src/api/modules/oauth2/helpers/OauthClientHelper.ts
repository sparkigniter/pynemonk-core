import { inject, injectable } from "tsyringe";
import type CreateClientRequest from "../dtos/requests/CreateClientRequest.ts";

@injectable()
class OauthClientHelper {

  protected db: any; // Replace with actual database connection type

  constructor(@inject("DB") DB: any) {
    // Initialize any necessary properties or dependencies
    this.db = DB;
  }

    public  async createClient(client: CreateClientRequest) : Promise<any> {
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

    public  async getAllClients() {
      const res = await this.db.query(`SELECT id, name, description, client_id, created_at, updated_at FROM auth.client`);
      return res;
    }

    public  async getClientByName(name: string) {
      const res = await this.db.query(`SELECT id, name, description, client_id, created_at, updated_at FROM auth.client WHERE name = $1`, [name]);
      return res.rows[0];
    }

    public  async getClientById(clientId: string) {
      const res = await this.db.query(`SELECT id, name, description, client_id, created_at, updated_at FROM auth.client WHERE id = $1`, [clientId]);
      return res.rows[0];
    }

    public  async getClientSecret(clientId: string) {
      const res = await this.db.query(`SELECT client_secret FROM auth.client WHERE id = $1`, [clientId]);
      if(res.rows.length === 0) {
        throw new Error("Client not found");
      }
      return res.rows[0].client_secret;
    } 
} 

export default OauthClientHelper;