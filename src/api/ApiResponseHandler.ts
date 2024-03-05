import * as express from 'express';
import ResponseHandler from '../ResponseHandler';

class ApiResponseHandler extends ResponseHandler {

    public static unautharized(res:express.Response, message?:String): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? "unautarized", success: false})
        return res.status(401).json(jsonRes);
    }

    public static ok(res:express.Response, message?:String, data?:any): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? "ok", success: true, data: data});
        return res.status(res.statusCode).json(jsonRes);
    }

    public static badrequest(res: express.Response, message?:String): express.Response {
        let jsonRes:JSON = this.jsonResponse({message: message ?? "bad_request", success: false});
        return res.status(400).json(jsonRes);
    }
}

export default ApiResponseHandler;