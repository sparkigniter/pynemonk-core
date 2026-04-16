import BaseController from "../../../core/controllers/BaseController.ts";
import { injectable } from "tsyringe";
import ClientScopeModel from "../models/ClientScopeModel.ts";
import { connect } from "http2";
import ValidationError from "../../../errors/ValidationError.ts";

@injectable()
class ClientScopeController extends BaseController {

    private clientScopeModel: ClientScopeModel;

    constructor(clientScopeModel: ClientScopeModel) {
        super();
        this.clientScopeModel = clientScopeModel;
    }

    /**
     * Create a new client scope
     * @param req 
     * @param res 
     * @returns 
     */
    public async create(req: any, res: any): Promise<any> {
        try {
            this.clientScopeModel.setScenario("CREATE_CLIENT_SCOPE"); // Set the scenario for validation
            if (!await this.clientScopeModel.validate(req.body)) {
                return this.badrequest(res);
            }
            const responseData = await this.clientScopeModel.save(req.body, true); // skip validation as it is already done above       
            return this.ok(res, "Scope associated with client successfully", responseData);

        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error.message);
            }
            return this.internalservererror(res, "An error occurred while associating scope with client");
        }
    }
}

export default ClientScopeController;