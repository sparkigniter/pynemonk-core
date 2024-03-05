import Joi from "joi";
import BaseModel from "../../../models/BaseModel";
import OauthClientDto from "../dtos/OauthClientDto";
import CryptoHelper from "../../../../helpers/CryptoHelper";
import { QueryResult } from "pg";

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

    public async save(attributes: any, validate: Boolean = true): Promise<Boolean> {
        if(validate && !this.validate(attributes)){
            return false;
        }
        if(this.error != undefined){
            return false;
        }
       const res =  await OauthClientDto.createClient({...attributes, "client_id": CryptoHelper.generateRandomString(16), "client_secret": CryptoHelper.generateRandomString(32)});
        return true;
    }

    public async getAll():  Promise<Array<any>> {
        const res = await OauthClientDto.getAllClients();
        return res.rows;
    }
}

export default ClientModel;