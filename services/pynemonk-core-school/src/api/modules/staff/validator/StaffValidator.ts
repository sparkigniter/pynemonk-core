import { injectable } from "tsyringe";
import Validator from "../../../core/Validator.js";
import Joi from "joi";

@injectable()
export default class StaffValidator extends Validator {
    constructor() {
        super();
        this.addRules(
            Joi.object({
                first_name: Joi.string().required(),
                last_name: Joi.string().allow("", null),
                user_id: Joi.number().required(),
                employee_code: Joi.string().allow("", null),
                gender: Joi.string().valid("Male", "Female", "Other").required(),
                date_of_birth: Joi.date().allow(null),
                phone: Joi.string().allow("", null),
                address: Joi.string().allow("", null),
                qualification: Joi.string().allow("", null),
                specialization: Joi.string().allow("", null),
                joining_date: Joi.date().allow(null),
                designation: Joi.string().allow("", null),
                blood_group: Joi.string().allow("", null),
                religion: Joi.string().allow("", null),
                nationality: Joi.string().allow("", null),
                emergency_contact_name: Joi.string().allow("", null),
                emergency_contact_phone: Joi.string().allow("", null),
                marital_status: Joi.string().allow("", null),
                experience_years: Joi.number().allow(null),
                status: Joi.string().valid("active", "inactive", "on_leave").default("active"),
                aadhaar_number: Joi.string().allow("", null),
                pan_number: Joi.string().allow("", null),
                bank_account_no: Joi.string().allow("", null),
                bank_name: Joi.string().allow("", null),
                ifsc_code: Joi.string().allow("", null),
                avatar_url: Joi.string().uri().allow("", null),
            }),
            "CREATE",
        );
    }
}
