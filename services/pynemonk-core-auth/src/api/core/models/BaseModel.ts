import Joi from "joi";
import pool from "../../../db/pg-pool.ts";
import ValidationError from "../../errors/ValidationError.ts";
import IBaseModel from "../interfaces/IBaseModel.ts";

class BaseModel implements IBaseModel {
    
    protected error?: Joi.ValidationError;

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

}

export default BaseModel;