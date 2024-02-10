import * as express from 'express'
import BaseController from "../../../controllers/BaseController";
import ClientModel from '../models/ClientModel';

class ClientController extends BaseController {

    public static async create(req: express.Request, res: express.Response): Promise<express.Response> {
        let client:ClientModel = new ClientModel(); 
        if(!client.validate(req.body)) {
            return this.badrequest(res);
        }
       const re = await client.save(req.body);
        return this.ok(res);
    }

}

export default ClientController;