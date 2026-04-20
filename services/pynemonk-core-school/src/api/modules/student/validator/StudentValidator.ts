import Joi from "joi";
import Validator from "../../../core/Validator.js";

export default class StudentValidator extends Validator {
    public getRules(scenario: string): Joi.Schema {
        switch (scenario) {
            case "CREATE_STUDENT":
                return Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).required(),
                    admission_no: Joi.string().required(),
                    first_name: Joi.string().required(),
                    last_name: Joi.string().allow("", null),
                    gender: Joi.string().valid("male", "female", "other").allow("", null),
                    date_of_birth: Joi.date().iso().allow("", null),
                    blood_group: Joi.string().allow("", null),
                    nationality: Joi.string().allow("", null),
                    religion: Joi.string().allow("", null),
                    phone: Joi.string().allow("", null),
                    address: Joi.string().allow("", null),
                    avatar_url: Joi.string().uri().allow("", null),
                    guardian_name: Joi.string().allow("", null),
                    guardian_phone: Joi.string().allow("", null),
                    guardian_email: Joi.string().email().allow("", null),
                    guardian_relation: Joi.string().allow("", null),
                });
            default:
                throw new Error("Invalid validation scenario");
        }
    }

    public async validate(scenario: string, data: any): Promise<void> {
        const schema = this.getRules(scenario);
        await this.validateAsync(schema, data);
    }
}
