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
                user_id: Joi.number().required(),
                gender: Joi.string().required()
            }), "CREATE");
    }
}
