import Joi from "joi";
import OauthClientHelper from "../helpers/OauthClientHelper.js";
import ValidationError from "../../../errors/ValidationError.js";
import Validator from "../../../core/Validator.js";
import { injectable, inject } from "tsyringe";
import OauthScopeHelper from "../helpers/OauthScopeHelper.js";

@injectable()
class ScopeValidator extends Validator {

    private OauthScopeHelper: OauthScopeHelper;

    constructor(@inject(OauthScopeHelper) oauthScopeHelper: OauthScopeHelper) {
        super();
        this.OauthScopeHelper = oauthScopeHelper;
    }

    private rules = {
        CREATE_SCOPE: Joi.object({
            value: Joi.string()
                .external(async (value) => {
                    const existingScope = await this.OauthScopeHelper.getScopeByValue(value);
                    if (existingScope) {
                        throw new ValidationError("Scope with this name already exists");
                    }
                })
                .required(),
            description: Joi.string(),
        }),
    };

    getRules(scenario: string): Joi.Schema {
        return this.rules[scenario as keyof typeof this.rules] || Joi.object({});
    }

    /**
     * @param scenario
     * @param attributes
     * @returns
     */
    public async validate(scenario: string, attributes: any): Promise<boolean> {
        const rules = this.getRules(scenario);
        try {
            await this.validateAsync(rules, attributes);
            return true;
        } catch (error) {
            throw error;
        }
    }
}

export default ScopeValidator;
