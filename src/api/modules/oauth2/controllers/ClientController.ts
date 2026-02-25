import * as express from 'express'
import BaseController from "../../../controllers/BaseController.ts";
import ClientModel from '../models/ClientModel.ts';
import { RESPONSE_TYPES } from '../../../../constants/constants.ts';

class ClientController extends BaseController {

    public static async create(req: express.Request, res: express.Response): Promise<express.Response> {
        try {
            let client:ClientModel = new ClientModel(); 
            if(!client.validate(req.body)) {
                return this.badrequest(res);
            }
            const responseData = await client.save(req.body, true); // skip validation as it is already done above
            return this.ok(res, RESPONSE_TYPES.SUCCESS, responseData);
        } catch (error) {
            return this.badrequest(res, error instanceof Error ? error.message : "An error occurred while creating client");
        }
    }

    public static async getAll(req: express.Request, res: express.Response): Promise<express.Response> {
        try {
            let client:ClientModel = new ClientModel();
            const data = await client.getAll();
            return this.ok(res, RESPONSE_TYPES.SUCCESS, data);
        } catch (error) {
            return this.badrequest(res, error instanceof Error ? error.message : "An error occurred while fetching clients");
        }
    }

}

export default ClientController;