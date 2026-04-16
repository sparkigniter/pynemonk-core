import { inject, injectable } from "tsyringe";
import CreateScopeRequest from "../dtos/requests/CreateScopeRequest.ts";

@injectable()
class OauthScopeHelper {


    protected db: any; // Replace with actual database connection type

    constructor(@inject("DB") DB: any) {
        // Initialize any necessary properties or dependencies
        this.db = DB;
    }

    public async createScope(scope: CreateScopeRequest): Promise<any> {
        const query = `
        INSERT INTO auth.scope (
          value, 
          description, 
          is_deleted, 
          created_at, 
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING id, value, description, is_deleted, created_at, updated_at;`;
      
      const values = [
        scope.value, 
        scope.description,   
        false, 
        new Date(),
        new Date()
      ];
      
      const res = await this.db.query(query, values);
      console.log("Scope created with ID:", res.rows);
      return res;
        
    }

    public async getScopeByValue(value: string): Promise<any> {
        const res = await this.db.query(`SELECT id, value, description, created_at, updated_at FROM auth.scope WHERE value = $1 AND is_deleted = $2`, [value, false]);
        return res.rows[0];
    }

    public async getAllScopes(): Promise<Array<any>> {
        const res = await this.db.query(`SELECT id, value, description, created_at, updated_at FROM auth.scope WHERE is_deleted = $1`, [false]);
        return res.rows;
     }

    public async getScopeById(id: string): Promise<any> {
        const res = await this.db.query(`SELECT id, value, description, created_at, updated_at FROM auth.scope WHERE id = $1 AND is_deleted = $2`, [id, false]);
        return res.rows[0];
     }
}

export default OauthScopeHelper;