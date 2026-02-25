import Joi from "joi";
import BaseModel from "../../../models/BaseModel.ts";
import OauthClientHelper from "../../auth/helpers/OauthClientHelper.ts";
import CryptoHelper from "../../../../helpers/CryptoHelper.ts";
import CreateClientRequest from "../dtos/requests/CreateClientRequest.ts";
import CreateClientResponse from "../dtos/responses/CreateClientRespons.ts";
//import { QueryResult } from "pg";

class ClientModel extends BaseModel{

    private rules() : Joi.Schema {
        return Joi.object({
            name: Joi.string(),
            description: Joi.string()
        });
    }

    public validate(attributes: any): Boolean {
        return super.validate(this.rules(), attributes);
    }

    public async save(attributes: any, skipValidation: Boolean = false): Promise<CreateClientResponse> {
        if(!skipValidation && (!this.validate(attributes)  || this.error != undefined)){
            throw new Error(this.error?.message);
        }
        const res =  await OauthClientHelper.createClient({...attributes, "client_id": CryptoHelper.generateRandomString(16), "client_secret": CryptoHelper.generateRandomString(32)});
        return res.rows[0];
    }

    public async getAll():  Promise<Array<CreateClientResponse>> {
        const res = await OauthClientHelper.getAllClients();
        return res.rows;
    }
}

export default ClientModel;