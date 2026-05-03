import "reflect-metadata";
import * as express from 'express';
import ClientController from './controllers/ClientController.js';
import TokenController from './controllers/TokenController.js';
import ScopeController from './controllers/ScopeController.js';
import ClientScopeController from './controllers/ClientScopeController.js';
import RoleController from './controllers/RoleController.js';
import RoleScopeController from './controllers/RoleScopeController.js';
import ClientRoleController from './controllers/ClientRoleController.js';
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

oauthRouter.post("/client-scope", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.create(req, res);
});

oauthRouter.get("/client-scope", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.getAll(req, res);
});

oauthRouter.delete("/client-scope/:clientId/:scopeId", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.delete(req, res);
});

oauthRouter.post("/client-scope/sync-template", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.syncTemplate(req, res);
});

oauthRouter.post("/client-scope/bulk-grant", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.bulkGrant(req, res);
});

oauthRouter.post("/client-scope/bulk-revoke", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.bulkRevoke(req, res);
});

oauthRouter.post("/client-scope/deprovision-template", requireAuth, (req, res) => {
    const clientScopeController = container.resolve(ClientScopeController);
    return clientScopeController.deprovisionTemplate(req, res);
});

oauthRouter.post("/token", (req, res) => {
    const tokenController = container.resolve(TokenController);
    return tokenController.issueToken(req, res);
});

oauthRouter.get("/role", requireAuth, (req, res) => {
    const roleController = container.resolve(RoleController);
    return roleController.getAll(req, res);
});

oauthRouter.get("/role-scope", requireAuth, (req, res) => {
    const roleScopeController = container.resolve(RoleScopeController);
    return roleScopeController.getAll(req, res);
});

oauthRouter.post("/role-scope", requireAuth, (req, res) => {
    const roleScopeController = container.resolve(RoleScopeController);
    return roleScopeController.create(req, res);
});

oauthRouter.delete("/role-scope/:roleId/:scopeId", requireAuth, (req, res) => {
    const roleScopeController = container.resolve(RoleScopeController);
    return roleScopeController.delete(req, res);
});

oauthRouter.post("/role/:roleId/sync-template", requireAuth, (req, res) => {
    const roleScopeController = container.resolve(RoleScopeController);
    return roleScopeController.syncTemplate(req, res);
});


oauthRouter.post("/role-scope/bulk-grant", requireAuth, (req, res) => {
    const roleScopeController = container.resolve(RoleScopeController);
    return roleScopeController.bulkGrant(req, res);
});

oauthRouter.post("/role-scope/bulk-revoke", requireAuth, (req, res) => {
    const roleScopeController = container.resolve(RoleScopeController);
    return roleScopeController.bulkRevoke(req, res);
});

oauthRouter.get("/client-role", requireAuth, (req, res) => {
    const clientRoleController = container.resolve(ClientRoleController);
    return clientRoleController.getAll(req, res);
});

oauthRouter.post("/client-role", requireAuth, (req, res) => {
    const clientRoleController = container.resolve(ClientRoleController);
    return clientRoleController.create(req, res);
});

oauthRouter.delete("/client-role/:clientId/:roleId", requireAuth, (req, res) => {
    const clientRoleController = container.resolve(ClientRoleController);
    return clientRoleController.delete(req, res);
});

export default oauthRouter;