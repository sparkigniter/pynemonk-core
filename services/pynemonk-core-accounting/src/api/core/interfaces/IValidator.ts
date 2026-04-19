import Joi from "joi";
import { injectable } from "tsyringe";

export default interface IValidator {
    validateAsync(schema: Joi.Schema, attributes: any): Promise<boolean>;
    validateSync(schema: Joi.Schema, attributes: any): Joi.ValidationResult;
    getRules(scenario: string): Joi.Schema;
}   