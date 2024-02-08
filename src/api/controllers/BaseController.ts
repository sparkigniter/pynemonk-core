import * as express from 'express'
import ApiResponseHandler from '../modules/ApiResponseHandler'

class BaseController {
    public static unautharized(res:express.Response, message?:String): express.Response {
        return ApiResponseHandler.unautharized(res, message);
    }
}

export default BaseController;