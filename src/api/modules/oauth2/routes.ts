import * as express from 'express';
import ClientController from './controllers/ClientController';
const oauthRouter = express.Router();


oauthRouter.post("/client", (req, res) => {
    return ClientController.create(req, res);   
});

export default oauthRouter;