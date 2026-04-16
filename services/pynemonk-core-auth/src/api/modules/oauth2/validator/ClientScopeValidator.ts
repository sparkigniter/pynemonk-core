import Validator from "../../../core/Validator.ts";
import Joi from "joi";
import OauthClientHelper from "../helpers/OauthClientHelper.ts";
import OauthScopeHelper from "../helpers/OauthScopeHelper.ts";
import { injectable } from "tsyringe";
import ValidationError from "../../../errors/ValidationError.ts";
import ClientScopeHelper from "../helpers/ClientScopeHelper.ts";

@injectable()
class ClientScopeValidator extends Validator{

    private oauthClientHelper: OauthClientHelper;
    private oauthScopeHelper: OauthScopeHelper;
    private clientScopeHelper: ClientScopeHelper; 

    constructor(oauthClientHelper: OauthClientHelper, oauthScopeHelper: OauthScopeHelper, clientScopeHelper: ClientScopeHelper) {
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