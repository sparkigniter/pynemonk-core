import Joi from "joi";
import IValidator from "../core/interfaces/IValidator.js";
import { inject, injectable } from "tsyringe";

@injectable()
export default class Validator implements IValidator {

    rules: { [key: string]: Joi.Schema } = {};

    async validateAsync(schema: Joi.Schema, attributes: any): Promise<boolean> {
        try {
            return await schema.validateAsync(attributes, { abortEarly: false });
        } catch (error) {
            throw error;
        }
    }
    validateSync(schema: Joi.Schema, attributes: any): Joi.ValidationResult {
        return schema.validate(attributes, { abortEarly: false });
    }
    getRules(scenario: string): Joi.Schema {
        if (this.rules[scenario]) {
            return this.rules[scenario];
        }
        throw new Error("Rules not found for scenario: " + scenario);
    }

    addRules(rules: Joi.Schema, scenario: string): void {
        this.rules[scenario] = rules;
    }
}