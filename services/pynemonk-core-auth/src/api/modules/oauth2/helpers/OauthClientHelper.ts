import pool from "../../../../db/pg-pool.ts";
import type CreateClientRequest from "../dtos/requests/CreateClientRequest.ts";

class OauthClientHelper {

    public  async createClient(client: CreateClientRequest) {
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
      
      const res = await pool.query(query, values);
      console.log("Client created with ID:", res.rows);
      return res;
      
    }

    public  async getAllClients() {
      const res = await pool.query(`SELECT id, name, description, client_id, created_at, updated_at FROM auth.client`);
      return res;
    }

    public  async getClientByName(name: string) {
      const res = await pool.query(`SELECT id, name, description, client_id, created_at, updated_at FROM auth.client WHERE name = $1`, [name]);
      return res.rows[0];
    }

    public  async getClientById(clientId: string) {
      const res = await pool.query(`SELECT id, name, description, client_id, created_at, updated_at FROM auth.client WHERE client_id = $1`, [clientId]);
      return res.rows[0];
    }

    public  async getClientSecret(clientId: string) {
      const res = await pool.query(`SELECT client_secret FROM auth.client WHERE client_id = $1`, [clientId]);
      if(res.rows.length === 0) {
        throw new Error("Client not found");
      }
      return res.rows[0].client_secret;
    } 
} 

export default OauthClientHelper;