import * as express from 'express'
import ApiResponseHandler from '../ApiResponseHandler.ts'

class BaseController {
    public static unautharized(res:express.Response, message?:string): express.Response {
        return ApiResponseHandler.unautharized(res, message);
    }

    public static ok(res:express.Response, message?:string, data?:any): express.Response {
        return ApiResponseHandler.ok(res, message, data);
    }

    public static badrequest(res:express.Response, message?:string): express.Response {
        return ApiResponseHandler.badrequest(res, message);
    }

}

export default BaseController;