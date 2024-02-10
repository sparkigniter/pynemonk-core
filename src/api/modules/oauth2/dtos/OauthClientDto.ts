import pool from "../../../../db/pg-pool";
import CreateClientRequest from "./requests/CreateClientRequest";

class OauthClientDto {

    public static async createClient(client: CreateClientRequest) {
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
        ) RETURNING id`;
      
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
      return res;
      
    }
} 

export default OauthClientDto;