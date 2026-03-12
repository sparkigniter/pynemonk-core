import e from "express";
import BaseController from "../../../core/controllers/BaseController.ts";
import ClientModel from '../models/ClientModel.ts';
import { RESPONSE_TYPES } from '../../../../constants/constants.ts';
import ValidationError from "../../../errors/ValidationError.ts";
import ClientValidator from "../validator/ClientValidator.ts";
import { injectable } from "tsyringe";

/**
 * Controller for handling client-related operations in the OAuth2 module.
 * This controller provides endpoints for creating and retrieving OAuth clients.
 */
@injectable()
class ClientController extends BaseController {
    
    /**
     * ClientModel instance for interacting with client data and performing operations such as validation and database interactions.
     */
    private clientModel: ClientModel;

    /**
     * constructor for ClientController
     * @param clientModel 
     * @param clientValidator 
     */
    constructor(clientModel: ClientModel) {
        super();
        this.clientModel = clientModel;
    }

    /**
     * creates a new OAuth client based on the request body parameters. It validates the input data, and if valid, saves the new client to the database. The response includes the created client's details or an error message if validation fails or an internal error occurs.
     * @param req 
     * @param res 
     * @returns 
     */
    public async create(req: e.Request, res: e.Response): Promise<e.Response> {
        try { 
            this.clientModel.setScenario("CREATE_CLIENT"); // Set the scenario for validation
            if(!await this.clientModel.validate(req.body)) {
                return this.badrequest(res);
            }
            const responseData = await this.clientModel.save(req.body, true); // skip validation as it is already done above
            return this.ok(res, RESPONSE_TYPES.SUCCESS, responseData);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error instanceof Error ? error.message : "An error occurred while creating client");
            }
            return this.internalservererror(res, "An error occurred while creating client");
        }
    }


    /**
     * Retrieves all OAuth clients. It interacts with the ClientModel to fetch the list of clients from the database and returns them in the response. If an error occurs during the retrieval process, it returns an appropriate error message.
     * @param req 
     * @param res 
     * @returns 
     */
    public  async getAll(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const data = await this.clientModel.getAll();
            return this.ok(res, RESPONSE_TYPES.SUCCESS, data);
        } catch (error) {
            return this.internalservererror(res, "An error occurred while fetching clients");
        }
    }

    /**
     * gets the client secret for a specific client based on the client ID provided in the request parameters. It uses the ClientModel to fetch the client secret from the database and returns it in the response. If the client is not found or an error occurs during retrieval, it returns an appropriate error message.
     * @param req 
     * @param res 
     * @returns 
     */
    public  async get(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const clientId = req.params.clientId;
            const data = await this.clientModel.getClientById(clientId);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, {client_id: clientId, client_secret: data});
        } catch (error) {
            return this.internalservererror(res, "An error occurred while fetching client");
        }
    }

}

export default ClientController;