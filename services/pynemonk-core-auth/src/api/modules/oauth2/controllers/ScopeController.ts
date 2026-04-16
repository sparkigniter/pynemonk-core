
import e from "express";
import BaseController from "../../../core/controllers/BaseController.ts";
import ValidationError from "../../../errors/ValidationError.ts";
import { RESPONSE_TYPES } from '../../../../constants/constants.ts';
import { injectable } from "tsyringe";
import ScopeModel from "../models/ScopeModel.ts";

@injectable()
class ScopeController extends BaseController {

    private scopeModel: ScopeModel;

    constructor(scopeModel: ScopeModel) {
        super();
        this.scopeModel = scopeModel;
    }

    /**
     * Create a new scope
     * @param req 
     * @param res 
     * @returns 
     */
    public async create(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            this.scopeModel.setScenario("CREATE_SCOPE"); // Set the scenario for validation
            if (!await this.scopeModel.validate(req.body)) {
                return this.badrequest(res);
            }
            const responseData = await this.scopeModel.save(req.body, true); // skip validation as it is already done above
            return this.ok(res, RESPONSE_TYPES.SUCCESS, responseData);
        } catch (error) {
            if (error instanceof ValidationError) {
                return this.badrequest(res, error instanceof Error ? error.message : "An error occurred while creating client");
            }
            return this.internalservererror(res, "An error occurred while creating client");
        }
    }

    /**
     * Get all scopes
     * @param req 
     * @param res 
     * @returns 
     */
    public async getAll(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const data = await this.scopeModel.getAll();
            return this.ok(res, RESPONSE_TYPES.SUCCESS, data);
        } catch (error) {
            return this.internalservererror(res, "An error occurred while fetching scopes");
        }
    }

    /**
     * Get a scope by id
     * @param req 
     * @param res 
     * @returns 
     */
    public async get(req: e.Request, res: e.Response): Promise<e.Response> {
        try {
            const data = await this.scopeModel.getById(req.params.id);
            return this.ok(res, RESPONSE_TYPES.SUCCESS, data);
        } catch (error) {
            return this.internalservererror(res, "An error occurred while fetching scope");
        }
    }
}

export default ScopeController;