import * as express from 'express';
import ResponseHandler from '../../ResponseHandler';

class ApiResponseHandler extends ResponseHandler {

    public static unautharized(res:express.Response, message?:String): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? "unautarized", success: false})
        return res.status(res.statusCode).json(jsonRes);
    }
}

export default ApiResponseHandler;