import BaseModel from "../../../core/models/BaseModel.ts";
import ValidationError  from "../../../errors/ValidationError.ts";
import OauthScopeHelper from "../helpers/OauthScopeHelper.ts";
import { injectable } from "tsyringe";
import ScopeValidator from "../validator/ScopeValidator.ts";
import Joi from "joi";

@injectable()
class ScopeModel extends BaseModel {

    private oauthScopeHelper: OauthScopeHelper;

    private scopeValidator: ScopeValidator; // TODO: Create ScopeValidator and replace 'any' with the correct type

    constructor(oauthScopeHelper: OauthScopeHelper, scopeValidator: ScopeValidator) {
        super();
        this.oauthScopeHelper = oauthScopeHelper;
        this.scopeValidator = scopeValidator;
    }

    public async validate(attributes: any): Promise<boolean> {
      try {
            await this.scopeValidator.validate(this.scenario, attributes);
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
        const res = await this.oauthScopeHelper.createScope(attributes);
        return res.rows[0];
    }

    public async getAll(): Promise<Array<any>> {
        const res = await this.oauthScopeHelper.getAllScopes();
        return res;
    }

    public async getById(id: string): Promise<any> {
        const res = await this.oauthScopeHelper.getScopeById(id);
        return res;
    }
}

export default ScopeModel;