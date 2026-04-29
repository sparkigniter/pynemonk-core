import "reflect-metadata";
import * as express from 'express';
import ClientController from './controllers/ClientController.js';
import TokenController from './controllers/TokenController.js';
import ScopeController from './controllers/ScopeController.js';
import ClientScopeController from './controllers/ClientScopeController.js';
import { container } from 'tsyringe';
import { requireAuth } from '../../core/middleware/requireAuth.js';
const oauthRouter = express.Router();

oauthRouter.post("/client", requireAuth, (req, res) => {
    const clientController = container.resolve(ClientController);
    return clientController.create(req, res);
});

oauthRouter.get("/client", requireAuth, (req, res) => {
    const clientController = container.resolve(ClientController);
    return clientController.getAll(req, res);
});

oauthRouter.post("/scope", requireAuth, (req, res) => {
    const scopeController = container.resolve(ScopeController);
    return scopeController.create(req, res);
});

oauthRouter.get("/scope", requireAuth, (req, res) => {
    const scopeController = container.resolve(ScopeController);
    return scopeController.getAll(req, res);
});

oauthRouter.post("/client-scope", (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.create(req, res);
});

oauthRouter.post("/token", (req, res) => {
    const tokenController = container.resolve(TokenController);
    return tokenController.issueToken(req, res);
});

export default oauthRouter;