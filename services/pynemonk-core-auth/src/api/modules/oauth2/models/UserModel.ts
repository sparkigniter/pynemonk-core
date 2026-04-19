import { injectable } from "tsyringe";
import BaseModel from "../../../core/models/BaseModel.js";
import pool from "../../../../db/pg-pool.js";

@injectable()
class UserModel extends BaseModel {

    public async getUser(email: string): Promise<any> {
        // get user from database
        const row = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        return row?.rows[0];
    }

    public async getUserCredential(email: string): Promise<any> {
        // get user from database
        const row = await pool.query("SELECT uc.password_hash as password, u.email "
            + " FROM auth.user u "
            + " INNER JOIN auth.user_credential uc ON u.id = uc.user_id "
            + " WHERE u.email = $1", [email]);
        console.log("User credential: ", row?.rows[0]);
        return row?.rows[0];
    }
}

export default UserModel;