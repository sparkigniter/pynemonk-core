import Validator from "../../../core/Validator.js";
import Joi from "joi";
import OauthClientHelper from "../helpers/OauthClientHelper.js";
import OauthScopeHelper from "../helpers/OauthScopeHelper.js";
import { injectable, inject } from "tsyringe";
import ValidationError from "../../../errors/ValidationError.js";
import ClientScopeHelper from "../helpers/ClientScopeHelper.js";

@injectable()
class ClientScopeValidator extends Validator{

    private oauthClientHelper: OauthClientHelper;
    private oauthScopeHelper: OauthScopeHelper;
    private clientScopeHelper: ClientScopeHelper; 

    constructor(@inject(OauthClientHelper) oauthClientHelper: OauthClientHelper, @inject(OauthScopeHelper) oauthScopeHelper: OauthScopeHelper, @inject(ClientScopeHelper) clientScopeHelper: ClientScopeHelper) {
        super();
        this.oauthClientHelper = oauthClientHelper;
        this.oauthScopeHelper = oauthScopeHelper;
        this.clientScopeHelper = clientScopeHelper;
    }

    private rules = {
        CREATE_CLIENT_SCOPE: Joi.object({
            client_id: Joi.number().required().external(async (value) => {
                const existingClient = await this.oauthClientHelper.getClientById(value);
                if (!existingClient) {
                    throw new ValidationError("Client with this id does not exist");
                }
                return existingClient.id;
            }),
            scope_id: Joi.number().required().external(async (value) => {
                const existingScope = await this.oauthScopeHelper.getScopeById(value);
                if (!existingScope) {
                    throw new ValidationError("Scope with this id does not exist");
                }
                return existingScope.id;
            }),
        }).external(async (value) => {
            console.log("Validating client scope with value:", value);
            const existingClientScope = await this.clientScopeHelper.getClientScope(value.client_id, value.scope_id);
            if (existingClientScope) {
                throw new ValidationError("This client already has this scope assigned");
            }
            return existingClientScope
        }),
    };

    getRules(scenario: string): any {
        return this.rules[scenario as keyof typeof this.rules] || Joi.object({}); 
    }

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
export default ClientScopeValidator;