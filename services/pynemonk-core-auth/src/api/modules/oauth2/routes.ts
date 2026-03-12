import "reflect-metadata";
import * as express from 'express';
import ClientController from './controllers/ClientController.ts';
import TokenController from './controllers/TokenController.ts';
import { container } from 'tsyringe';
const oauthRouter = express.Router();


oauthRouter.post("/client", (req, res) => {
    const clientController = container.resolve(ClientController);
    return clientController.create(req, res);   
});

oauthRouter.get("/client", (req, res) => {
    const clientController = container.resolve(ClientController);
    return clientController.getAll(req, res);   
});

// oauthRouter.post("/token", (req, res) => {
//     const tokenController = container.resolve(TokenController);
//     return tokenController.issueToken(req, res);
// });

export default oauthRouter;