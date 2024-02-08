import * as express from 'express'
import BaseController from '../../../controllers/BaseController';

class AuthenticationController extends BaseController {

    public static login(req: express.Request, res: express.Response): express.Response{
        /**
         * TODO : Write logic for login authentication
         */
        return this.unautharized(res, "unable to login")
    }
}

export default AuthenticationController;