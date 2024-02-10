import Joi from "joi";
import pool from "../../db/pg-pool";

class BaseModel {

    protected error?: Joi.ValidationError;

    protected validate(schema: Joi.Schema, attributes: any): Boolean{
        const { error } = schema.validate(attributes);
        if(error !== undefined){
            this.error = error;
            return false;
        }
        return true; 
    }

    protected ruels(): Joi.Schema {
        return Joi.object();
    }

}

export default BaseModel;