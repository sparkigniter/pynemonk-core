import Joi from "joi";
import BaseModel from "../../../core/models/BaseModel.ts";
import OauthClientHelper from "../helpers/OauthClientHelper.ts";
import CryptoHelper from "../../../../helpers/CryptoHelper.ts";
import type {CreateClientResponse} from "../dtos/responses/CreateClientRespons.ts";
import ValidationError from "../../../errors/ValidationError.ts";
import { injectable } from "tsyringe";
import ClientValidator from "../validator/ClientValidator.ts";

@injectable()
class ClientModel extends BaseModel{
    
    name!: string;
    description!: string;
    client_id!: string;
    client_secret!: string;

    protected scenario: string = "";

    protected clientValidator: ClientValidator;
    protected oauthClientHelper: OauthClientHelper;

    constructor(clientValidator: ClientValidator, oauthClientHelper: OauthClientHelper) {
        super();
        this.clientValidator = clientValidator;
        this.oauthClientHelper = oauthClientHelper;
    }

    public setScenario(scenario: string) {
        this.scenario = scenario;
    }

    public async validate(attributes: any): Promise<boolean> {
      try {
            await this.clientValidator.validate(this.scenario, attributes);
            return true;
        } catch (error) {
            this.error = error as Joi.ValidationError;
            throw error;
        }
    }

    public async save(attributes: any, skipValidation: Boolean = false): Promise<CreateClientResponse> {
        if(!skipValidation && (! await this.validate(attributes) || this.error != undefined)){
            throw new ValidationError(this.error?.message || "Validation failed");
        }
        const res =  await this.oauthClientHelper.createClient({...attributes, "client_id": CryptoHelper.generateRandomString(16), "client_secret": CryptoHelper.generateRandomString(32)});
        return res.rows[0];
    }

    public async getAll():  Promise<Array<CreateClientResponse>> {
        const res = await this.oauthClientHelper.getAllClients();
        return res.rows;
    }

    public async getClientById(clientId: string): Promise<string> {
        const res = await this.oauthClientHelper.getClientById(clientId);
        const client = res.rows.find((row: CreateClientResponse) => row.client_id === clientId);
        if(!client) {
            throw new Error("Client not found");
        }
        return client.client_secret;
    }
    
    public async getClientSecret(clientId: string): Promise<string> {
        const res = await this.oauthClientHelper.getClientSecret(clientId);
        if(!res) {
            throw new Error("Client not found");
        }
        return res;
    }
}

export default ClientModel;