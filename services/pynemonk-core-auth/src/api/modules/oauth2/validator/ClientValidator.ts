import Joi from "joi";
import OauthClientHelper from "../helpers/OauthClientHelper.js";
import ValidationError from "../../../errors/ValidationError.js";
import Validator from "../../../core/Validator.js";
import { injectable, inject } from "tsyringe";

@injectable()
class ClientValidator extends Validator {

    private OauthClientHelper: OauthClientHelper;

    constructor(@inject(OauthClientHelper) oauthClientHelper: OauthClientHelper) {
        super();
        this.OauthClientHelper = oauthClientHelper;
    }

    private rules = {
        CREATE_CLIENT: Joi.object({
            name: Joi.string()
                .external(async (value) => {
                    const existingClient = await this.OauthClientHelper.getClientByName(value);
                    if (existingClient) {
                        throw new ValidationError("Client with this name already exists");
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

export default ClientValidator;
