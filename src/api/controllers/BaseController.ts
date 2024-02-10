import * as express from 'express'
import ApiResponseHandler from '../ApiResponseHandler'

class BaseController {
    public static unautharized(res:express.Response, message?:String): express.Response {
        return ApiResponseHandler.unautharized(res, message);
    }

    public static ok(res:express.Response, message?:String): express.Response {
        return ApiResponseHandler.ok(res, message);
    }

    public static badrequest(res:express.Response, message?:String): express.Response {
        return ApiResponseHandler.badrequest(res, message);
    }

}

export default BaseController;