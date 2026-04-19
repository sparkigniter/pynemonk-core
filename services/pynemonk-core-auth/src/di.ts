import "reflect-metadata";
import { container } from "tsyringe";

// Infrastructure
import pool from "./db/pg-pool.js";

// OAuth2 — helpers
import OauthClientHelper from "./api/modules/oauth2/helpers/OauthClientHelper.js";
import OauthScopeHelper from "./api/modules/oauth2/helpers/OauthScopeHelper.js";
import ClientScopeHelper from "./api/modules/oauth2/helpers/ClientScopeHelper.js";

// OAuth2 — validators
import ClientValidator from "./api/modules/oauth2/validator/ClientValidator.js";
import ScopeValidator from "./api/modules/oauth2/validator/ScopeValidator.js";
import ClientScopeValidator from "./api/modules/oauth2/validator/ClientScopeValidator.js";

// OAuth2 — models
import ClientModel from "./api/modules/oauth2/models/ClientModel.js";
import ScopeModel from "./api/modules/oauth2/models/ScopeModel.js";
import ClientScopeModel from "./api/modules/oauth2/models/ClientScopeModel.js";

// OAuth2 — grant handlers
import AuthorizationCodeGrantHandler from "./api/modules/oauth2/handlers/AuthorizationCodeGrantHandler.js";
import ClientCredentialsGrantHandler from "./api/modules/oauth2/handlers/ClientCredentialsGrantHandler.js";
import PasswordGrantHandler from "./api/modules/oauth2/handlers/PasswordGrantHandler.js";
import RefreshTokenGrantHandler from "./api/modules/oauth2/handlers/RefreshTokenGrantHandler.js";
import ImplicitGrantHandler from "./api/modules/oauth2/handlers/ImplicitGrantHandler.js";
import GrantHandlerFactory from "./api/modules/oauth2/factory/GrantHandlerFactory.js";

// OAuth2 — controllers
import TokenController from "./api/modules/oauth2/controllers/TokenController.js";

// Token service (shared)
import TokenService from "./services/TokenService.js";

// Auth module
import UserHelper from "./api/modules/auth/helpers/UserHelper.js";
import UserValidator from "./api/modules/auth/validator/UserValidator.js";
import AuthService from "./api/modules/auth/services/AuthService.js";
import AuthController from "./api/modules/auth/controllers/AuthController.js";
import IntrospectController from "./api/modules/auth/controllers/IntrospectController.js";

// Tenant module
import TenantHelper from "./api/modules/tenant/helpers/TenantHelper.js";
import TenantValidator from "./api/modules/tenant/validator/TenantValidator.js";
import TenantService from "./api/modules/tenant/services/TenantService.js";
import TenantController from "./api/modules/tenant/controllers/TenantController.js";

function setupDI(): void {

    // ── Infrastructure ──────────────────────────────────────────────────────
    container.registerInstance("DB", pool);

    // ── Shared services ─────────────────────────────────────────────────────
    container.register(TokenService, { useClass: TokenService });

    // ── OAuth2 helpers ───────────────────────────────────────────────────────
    container.register(OauthClientHelper, { useClass: OauthClientHelper });
    container.register(OauthScopeHelper, { useClass: OauthScopeHelper });
    container.register(ClientScopeHelper, { useClass: ClientScopeHelper });

    // ── OAuth2 validators ────────────────────────────────────────────────────
    container.register(ClientValidator, { useClass: ClientValidator });
    container.register(ScopeValidator, { useClass: ScopeValidator });
    container.register(ClientScopeValidator, { useClass: ClientScopeValidator });

    // ── OAuth2 models ────────────────────────────────────────────────────────
    container.register(ClientModel, { useClass: ClientModel });
    container.register(ScopeModel, { useClass: ScopeModel });
    container.register(ClientScopeModel, { useClass: ClientScopeModel });

    // ── Grant handlers ───────────────────────────────────────────────────────
    container.register(AuthorizationCodeGrantHandler, { useClass: AuthorizationCodeGrantHandler });
    container.register(ClientCredentialsGrantHandler, { useClass: ClientCredentialsGrantHandler });
    container.register(PasswordGrantHandler, { useClass: PasswordGrantHandler });
    container.register(RefreshTokenGrantHandler, { useClass: RefreshTokenGrantHandler });
    container.register(ImplicitGrantHandler, { useClass: ImplicitGrantHandler });
    container.register(GrantHandlerFactory, { useClass: GrantHandlerFactory });

    // ── OAuth2 controllers ───────────────────────────────────────────────────
    container.register(TokenController, { useClass: TokenController });

    // ── Auth module ──────────────────────────────────────────────────────────
    container.register(UserHelper, { useClass: UserHelper });
    container.register(UserValidator, { useClass: UserValidator });
    container.register(AuthService, { useClass: AuthService });
    container.register(AuthController, { useClass: AuthController });
    container.register(IntrospectController, { useClass: IntrospectController });

    // ── Tenant module — explicit factories (metadata-independent) ────────────
    container.register(TenantHelper, {
        useFactory: (c) => new TenantHelper(c.resolve("DB") as any),
    });
    container.register(TenantValidator, {
        useFactory: () => new TenantValidator(),
    });
    container.register(TenantService, {
        useFactory: (c) => new TenantService(
            c.resolve(TenantHelper),
            c.resolve(TenantValidator),
        ),
    });
    container.register(TenantController, {
        useFactory: (c) => new TenantController(c.resolve(TenantService)),
    });
}

export default setupDI;