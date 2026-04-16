import { inject, injectable } from "tsyringe";

@injectable()   
class ClientScopeHelper {

    protected db: any; 

    constructor(@inject("DB") DB: any ) {
        this.db = DB;   
    }

    public async addClientScope(clientId: string, scopeId: string): Promise<any> {
        const query = `INSERT INTO auth.client_scope (client_id, scope_id, is_deleted) VALUES ($1, $2, $3) RETURNING id, client_id, scope_id;`;
        const values = [clientId, scopeId, false];
        const res = await this.db.query(query, values);
        console.log("ClientScope created with ID:", res.rows[0].id);
        return res.rows[0];
    }

    public async getClientScope(clientId: number, scopeId: number): Promise<any> {
        const query = `SELECT id, client_id, scope_id FROM auth.client_scope WHERE client_id = $1 AND scope_id = $2 AND is_deleted = $3`;
        const values = [clientId, scopeId, false];
        const res = await this.db.query(query, values);
        return res.rows[0];
    }

    public async getAllClientScopes(): Promise<any> {
        const query = `SELECT id, client_id, scope_id FROM auth.client_scope WHERE is_deleted = $1`;
        const values = [false];
        const res = await this.db.query(query, values);
        return res.rows;
     }
}

export default ClientScopeHelper;

