import { injectable, inject } from "tsyringe";
import bcrypt from "bcrypt";
import UserHelper from "../helpers/UserHelper.js";
import UserValidator from "../validator/UserValidator.js";
import ValidationError from "../../../errors/ValidationError.js";
import OauthClientHelper from "../../oauth2/helpers/OauthClientHelper.js";
import GrantHandlerFactory from "../../oauth2/factory/GrantHandlerFactory.js";
import type { RegisterUserRequest, LoginRequest, UserRecord } from "../../../../types/User.js";
import type { TokenResponse, TokenPayload, LoginResult } from "../../../../types/Token.js";

const SALT_ROUNDS = 12;
const REFRESH_TTL_DAYS = 7;

@injectable()
class AuthService {

    constructor(@inject(UserHelper) private userHelper: UserHelper, @inject(UserValidator) private userValidator: UserValidator, @inject(GrantHandlerFactory) private grantFactory: GrantHandlerFactory, @inject(OauthClientHelper) private oauthClientHelper: OauthClientHelper,) { }

    // ─── Register ────────────────────────────────────────────────────────────

    /**
     * Validates input, hashes password, creates user + profile, returns safe user record.
     */
    public async register(data: RegisterUserRequest): Promise<Omit<UserRecord, "is_deleted">> {
        // validate
        await this.userValidator.validate("REGISTER", data);

        // hash password
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // persist user
        const user = await this.userHelper.createUser(data.email, data.role_id);

        // persist credential
        await this.userHelper.createCredential(user.id, passwordHash);

        // persist profile (optional fields)
        await this.userHelper.createProfile(user.id, data.first_name, data.last_name, data.phone);

        return {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
            tenant_id: user.tenant_id
        };
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Validates client + user credentials, then dispatches token generation
     * to the appropriate grant handler based on the requested grant_type.
     */
    public async login(data: LoginRequest): Promise<LoginResult> {
        // 1. Basic validation
        await this.userValidator.validate("LOGIN", data);

        // 2. Validate Client (Query 1)
        const client = await this.oauthClientHelper.getClientById(data.client_id);
        if (!client || !client.is_active || client.client_secret !== data.client_secret) {
            throw new ValidationError("Invalid client credentials or client inactive");
        }

        // 3. Fetch Full Login Context (Query 2 - The Super Query)
        const context = await this.userHelper.getFullLoginContext(data.email, data.client_id, data.school_slug);
        if (!context) {
            throw new ValidationError("Invalid email or password");
        }

        // 4. Verify Password
        const valid = await bcrypt.compare(data.password, context.password);
        if (!valid) {
            throw new ValidationError("Invalid email or password");
        }

        // 5. Handle Tenancy Discovery
        const allTenants = context.all_tenants || [];
        const currentTenant = context.current_tenant?.[0];

        if (!data.school_slug && allTenants.length > 1) {
            return {
                status: 'MULTIPLE_TENANTS',
                tenants: allTenants.map((t: any) => ({
                    id: t.id,
                    uuid: t.uuid,
                    name: t.name,
                    slug: t.slug
                }))
            };
        }

        // 6. Build Token Payload
        const roles = context.roles || [];
        const roleSlugs = roles.map((r: any) => r.slug);
        console.log("[AuthService.login] Roles found:", JSON.stringify(roles, null, 2));
        console.log("[AuthService.login] roleSlugs:", roleSlugs);

        const primaryRole = roles.find((r: any) => r.is_primary) || roles[0];
        const scopeString = (context.permissions || []).join(' ');

        // Verify Role-Client Access
        const isAllowed = await this.oauthClientHelper.isRoleAllowed(data.client_id, roleSlugs);
        console.log("[AuthService.login] isAllowed for client:", data.client_id, "=>", isAllowed);
        if (!isAllowed) {
            throw new ValidationError("Access Denied: Your role is not authorized to use this application.");
        }

        const payload: any = {
            grant_type: data.grant_type,
            client_id: data.client_id,
            client_secret: data.client_secret,
            scope: scopeString,
            sub: String(context.user_id),
            email: context.email,
            role_id: primaryRole ? primaryRole.id : null,
            roles: roleSlugs,
            tenant_id: currentTenant?.id || null,
            preverified_context: context // Peak optimization: pass the whole context
        };

        // 7. Dispatch to the grant handler
        const handler = this.grantFactory.getHandler(data.grant_type);
        const tokenPair = await handler.handle(payload);

        // 8. Save session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
        await this.userHelper.saveRefreshToken(context.user_id, 0, tokenPair.refresh_token, expiresAt);

        return tokenPair;
    }

    // ─── Refresh ─────────────────────────────────────────────────────────────

    /**
     * Validates the refresh token, revokes it (rotation), issues a new pair.
     */
    public async refreshTokens(data: {
        refresh_token: string;
        client_id: string;
        client_secret: string;
    }): Promise<TokenResponse> {

        await this.userValidator.validate("REFRESH_TOKEN", data);

        // Validate client
        let clientDbSecret: string;
        try {
            clientDbSecret = await this.oauthClientHelper.getClientSecret(data.client_id);
        } catch {
            throw new ValidationError("Invalid client_id");
        }
        if (clientDbSecret !== data.client_secret) {
            throw new ValidationError("Invalid client_secret");
        }

        // Look up stored token
        const stored = await this.userHelper.getRefreshToken(data.refresh_token);
        if (!stored) throw new ValidationError("Invalid refresh_token");
        if (stored.revoked) throw new ValidationError("Refresh token has been revoked");
        if (new Date(stored.expires_at) < new Date()) throw new ValidationError("Refresh token has expired");

        // Revoke old token (rotation)
        await this.userHelper.revokeRefreshToken(data.refresh_token);

        // Load user
        const user = await this.userHelper.getUserById(stored.user_id);
        if (!user) throw new ValidationError("User not found");

        // Load roles and tenancy
        const roles = await this.userHelper.getUserRoles(user.id);
        const roleSlugs = roles.map(r => r.slug);
        const primaryRole = roles.find(r => r.is_primary) || roles[0];
        
        // Find tenant_id (if not explicitly stored in token, derive from user or roles)
        const tenants = await this.userHelper.getUserTenants(user.id);
        const tenantId = stored.tenant_id || (tenants.length === 1 ? tenants[0].id : user.tenant_id);

        // 7. Aggregate all permissions (scopes) using the high-architecture method
        const permissions = await this.userHelper.getEffectivePermissions(user.id, data.client_id, tenantId);
        
        // 7b. Intersect with allowed client scopes
        const clientScopes = await this.oauthClientHelper.getClientScopes(data.client_id);
        const effectiveScopes = clientScopes.length > 0 
            ? permissions.filter(p => clientScopes.includes(p))
            : permissions;

        const scopeString = effectiveScopes.join(' ');

        const payload: TokenPayload = {
            grant_type: 'refresh_token',
            client_id: data.client_id,
            client_secret: data.client_secret,
            scope: scopeString,
            exp: Math.floor(Date.now() / 1000) + 3600,
            sub: String(user.id),
            email: user.email,
            role_id: primaryRole ? primaryRole.id : user.role_id,
            roles: roleSlugs,
            tenant_id: tenantId,
        } as any;

        const handler = this.grantFactory.getHandler('refresh_token');
        const tokenPair = await handler.handle(payload);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
        await this.userHelper.saveRefreshToken(user.id, 0, tokenPair.refresh_token, expiresAt);

        return tokenPair;
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    /**
     * Revokes all refresh tokens for the user (full logout).
     */
    public async logout(userId: number): Promise<void> {
        await this.userHelper.revokeAllUserRefreshTokens(userId);
    }

    /**
     * Get all tenants associated with the user.
     */
    public async getUserTenants(userId: number): Promise<any[]> {
        return this.userHelper.getUserTenants(userId);
    }
}

export default AuthService;
