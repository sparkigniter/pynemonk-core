import Joi from "joi";
import Validator from "../../../core/Validator.js";

export default class FeeCategoryValidator extends Validator {
    public getRules(scenario: string): Joi.Schema {
        switch (scenario) {
            case "CREATE_FEE_CATEGORY":
                return Joi.object({
                    name: Joi.string().required(),
                    description: Joi.string().allow('', null),
                    is_mandatory: Joi.boolean().default(true),
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
