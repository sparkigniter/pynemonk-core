import Joi from "joi";
import { injectable } from "tsyringe";
import IValidator from "./interfaces/IValidator.js";

@injectable()
export default class Validator implements IValidator {
    rules: { [key: string]: Joi.Schema } = {};

    async validateAsync(schema: Joi.Schema, attributes: any): Promise<boolean> {
        return await schema.validateAsync(attributes, { abortEarly: false });
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
