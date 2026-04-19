import "reflect-metadata";
import Joi from "joi";
import { injectable } from "tsyringe";

@injectable()
class TenantValidator {

    private registerSchema = Joi.object({
        // School details only
        name:       Joi.string().min(2).max(255).required(),
        email:      Joi.string().email().required(),
        phone:      Joi.string().max(30).optional().allow(""),
        address:    Joi.string().max(500).optional().allow(""),
        city:       Joi.string().max(100).optional().allow(""),
        state:      Joi.string().max(100).optional().allow(""),
        country:    Joi.string().max(100).optional().allow(""),
        package_id: Joi.number().integer().positive().required(),
    });

    /** Schema for step 2 — create the owner account after school is registered */
    private ownerSchema = Joi.object({
        admin_email:    Joi.string().email().required(),
        admin_password: Joi.string().min(8).required(),
    });

    constructor() {}

    public async validate(data: unknown): Promise<void> {
        await this.registerSchema.validateAsync(data, { abortEarly: false });
    }

    public async validateOwner(data: unknown): Promise<void> {
        await this.ownerSchema.validateAsync(data, { abortEarly: false });
    }
}

export default TenantValidator;
