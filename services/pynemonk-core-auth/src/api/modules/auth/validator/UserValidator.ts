import Joi from "joi";
import Validator from "../../../core/Validator.js";
import { injectable, inject } from "tsyringe";
import UserHelper from "../helpers/UserHelper.js";
import ValidationError from "../../../errors/ValidationError.js";

@injectable()
class UserValidator extends Validator {

    private userHelper: UserHelper;

    constructor(@inject(UserHelper) userHelper: UserHelper) {
        super();
        this.userHelper = userHelper;
    }

    private rules = {
        REGISTER: Joi.object({
            email: Joi.string()
                .email()
                .external(async (value: string) => {
                    const existing = await this.userHelper.getUserByEmail(value);
                    if (existing) {
                        throw new ValidationError("A user with this email already exists");
                    }
                })
                .required(),
            password: Joi.string().min(8).required()
                .messages({
                    "string.min": "Password must be at least 8 characters",
                }),
            role_id: Joi.number().integer().positive().required(),
            tenant_id: Joi.number().integer().positive().required(),
            first_name: Joi.string().max(100).optional(),
            last_name: Joi.string().max(100).optional(),
            phone: Joi.string().max(20).optional(),
        }),

        LOGIN: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            client_id: Joi.string().required(),
            client_secret: Joi.string().required(),
            grant_type: Joi.string().required(),
            school_slug: Joi.string().optional(),
            scope: Joi.string().optional(),
        }),

        REFRESH_TOKEN: Joi.object({
            refresh_token: Joi.string().required(),
            client_id: Joi.string().required(),
            client_secret: Joi.string().required(),
        }),
    };

    getRules(scenario: string): Joi.Schema {
        return this.rules[scenario as keyof typeof this.rules] ?? Joi.object({});
    }

    public async validate(scenario: string, attributes: any): Promise<boolean> {
        const rules = this.getRules(scenario);
        await this.validateAsync(rules, attributes);
        return true;
    }
}

export default UserValidator;
