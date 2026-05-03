import * as express from "express";
import ResponseHandler from "./ResponseHandler.js";
import { RESPONSE_TYPES } from "../../constants/constants.js";

class ApiResponseHandler extends ResponseHandler {
    public static unautharized(res: express.Response, message?: string): express.Response {
        const jsonRes: JSON = this.jsonResponse({
            message: message ?? RESPONSE_TYPES.UNAUTHORIZED,
            success: false,
        });
        return res.status(401).json(jsonRes);
    }

    public static ok(res: express.Response, message?: string, data?: any): express.Response {
        const jsonRes: JSON = this.jsonResponse({
            message: message ?? RESPONSE_TYPES.SUCCESS,
            success: true,
            data: data,
        });
        return res.status(res.statusCode).json(jsonRes);
    }

    public static badrequest(res: express.Response, message?: string): express.Response {
        const jsonRes: JSON = this.jsonResponse({
            message: message ?? RESPONSE_TYPES.BAD_REQUEST,
            success: false,
        });
        return res.status(400).json(jsonRes);
    }

    public static forbidden(res: express.Response, message?: string): express.Response {
        const jsonRes: JSON = this.jsonResponse({
            message: message ?? "Forbidden: You do not have permission to access this resource",
            success: false,
        });
        return res.status(403).json(jsonRes);
    }
}

export default ApiResponseHandler;
