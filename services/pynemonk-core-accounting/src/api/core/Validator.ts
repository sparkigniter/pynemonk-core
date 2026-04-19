import Joi, { Schema } from "joi";
import IValidator from "../core/interfaces/IValidator.js";
import { inject, injectable } from "tsyringe";

@injectable()
export default class Validator implements IValidator {

    async validateAsync(schema:Joi.Schema, attributes: any): Promise<boolean> {
        try {
            return await schema.validateAsync(attributes, { abortEarly: false });
        } catch (error) {
            throw error;
        }
    }
    validateSync(schema:Joi.Schema, attributes: any): Joi.ValidationResult {
        return schema.validate(attributes, { abortEarly: false });
    }
    getRules(scenario: string): Joi.Schema {
        throw new Error("Method not implemented.");
    }
}