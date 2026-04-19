import Joi from "joi";
import pool from "../../../db/pg-pool.js";
import ValidationError from "../../errors/ValidationError.js";
import IBaseModel from "../interfaces/IBaseModel.js";

class BaseModel implements IBaseModel {
    
    protected error?: Joi.ValidationError;

    protected scenario: string = "";

    id?: number | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;

    async save(attributes: any, skipValidation?: boolean): Promise<any> {
        throw new Error("Method not implemented.");
    }

    async validate(attributes: any): Promise<any>{
        try {
            const rules = this.ruels();
            return await rules.validateAsync(attributes);
        } catch (error) {
            this.error = error as Joi.ValidationError;
            throw new ValidationError(this.error.message);
        }
    }

    protected ruels(): Joi.Schema {
        return Joi.object();
    }

    public setScenario(scenario: string) {
        this.scenario = scenario;
    }    

    

}

export default BaseModel;