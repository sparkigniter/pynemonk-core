import BaseModel from "../../../core/models/BaseModel.js";
import ValidationError from "../../../errors/ValidationError.js";
import { injectable, inject } from "tsyringe";
import Joi from "joi";
import e from "express";
import ClientScopeHelper from "../helpers/ClientScopeHelper.js";
import ClientScopeValidator from "../validator/ClientScopeValidator.js";

@injectable()
class ClientScopeModel extends BaseModel {

    private clientScopeHelper: ClientScopeHelper; 
    private clientScopeValidator: ClientScopeValidator; 
    constructor(@inject(ClientScopeHelper) clientScopeHelper: ClientScopeHelper, @inject(ClientScopeValidator) clientScopeValidator: ClientScopeValidator) {
        super();
        this.clientScopeHelper = clientScopeHelper;
        this.clientScopeValidator = clientScopeValidator;
    }

    public async validate(attributes: any): Promise<boolean> {
      try {
            await this.clientScopeValidator.validate(this.scenario, attributes);
            return true;
        } catch (error) {
            this.error = error as Joi.ValidationError;
            throw error;
        }
    }      

    public async save(attributes: any, skipValidation: boolean = false): Promise<any> {
        if(!skipValidation && (!await this.validate(attributes) || this.error != undefined)){
            throw new ValidationError(this.error?.message || "Validation failed");
        }
        console.log("Saving client scope with attributes:", attributes);
        const res = await this.clientScopeHelper.addClientScope(attributes.client_id, attributes.scope_id);
        return res;        
    }

    public async getAll(): Promise<any> {
        return this.clientScopeHelper.getAllClientScopes();
    }

    public async delete(clientId: number, scopeId: number): Promise<any> {
        return this.clientScopeHelper.removeClientScope(clientId, scopeId);
    }
}

export default ClientScopeModel;