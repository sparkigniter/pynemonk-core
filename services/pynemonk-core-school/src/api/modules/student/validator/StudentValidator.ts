import Joi from "joi";
import Validator from "../../../core/Validator.js";

export default class StudentValidator extends Validator {
    public getRules(scenario: string): Joi.Schema {
        switch (scenario) {
            case "CREATE_STUDENT":
                return Joi.object({
                    student: Joi.object({
                        admission_no: Joi.string().required(),
                        first_name: Joi.string().required(),
                        last_name: Joi.string().allow("", null),
                        email: Joi.string().email().allow("", null),
                        gender: Joi.string().valid("male", "female", "other").allow("", null),
                        date_of_birth: Joi.date().iso().allow("", null),
                        blood_group: Joi.string().allow("", null),
                        mother_tongue: Joi.string().allow("", null),
                        nationality: Joi.string().allow("", null),
                        religion: Joi.string().allow("", null),
                        phone: Joi.string().allow("", null),
                        address: Joi.string().allow("", null),
                        status: Joi.string().allow("", null)
                    }).required().unknown(true),
                    guardian: Joi.object({
                        first_name: Joi.string().required(),
                        last_name: Joi.string().allow("", null),
                        email: Joi.string().email().allow("", null),
                        phone: Joi.string().required(),
                        relation: Joi.string().required(),
                        occupation: Joi.string().allow("", null),
                        is_emergency: Joi.boolean().default(true)
                    }).required().unknown(true),
                    enrollment: Joi.object({
                        grade_id: Joi.number().required(),
                        section: Joi.string().default("A"),
                        academic_year_id: Joi.number().required(),
                        roll_number: Joi.string().allow("", null)
                    }).required().unknown(true),
                    finance: Joi.object({
                        fee_category: Joi.string().allow("", null),
                        discount_percent: Joi.number().allow(0),
                        payment_mode: Joi.string().allow("", null)
                    }).optional().unknown(true)
                }).unknown(true);
            default:
                throw new Error("Invalid validation scenario");
        }
    }

    public async validate(scenario: string, data: any): Promise<void> {
        const schema = this.getRules(scenario);
        await this.validateAsync(schema, data);
    }
}
