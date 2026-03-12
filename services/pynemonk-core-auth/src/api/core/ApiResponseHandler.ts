import * as express from 'express';
import ResponseHandler from './ResponseHandler.ts';
import { RESPONSE_TYPES } from '../../constants/constants.ts';

class ApiResponseHandler extends ResponseHandler {

    public static unautharized(res:express.Response, message?:string): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? RESPONSE_TYPES.UNAUTHORIZED, success: false})
        return res.status(401).json(jsonRes);
    }

    public static ok(res:express.Response, message?:string, data?:any): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? RESPONSE_TYPES.SUCCESS, success: true, data: data});
        return res.status(res.statusCode).json(jsonRes);
    }

    public static badrequest(res: express.Response, message?:string): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? RESPONSE_TYPES.BAD_REQUEST, success: false});
        return res.status(400).json(jsonRes);
    }
}

export default ApiResponseHandler;