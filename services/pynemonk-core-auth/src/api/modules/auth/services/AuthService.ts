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
        // 1. Validate input shape
        await this.userValidator.validate("LOGIN", data);

        // 2. Validate OAuth client
        let clientDbSecret: string;
        try {
            clientDbSecret = await this.oauthClientHelper.getClientSecret(data.client_id);
        } catch (error) {
            console.log("Invalid client_id login service ", error);
            throw new ValidationError("Invalid client_id");
        }
        if (clientDbSecret !== data.client_secret) {
            console.log("Invalid client_secret login service");
            throw new ValidationError("Invalid client_secret");
        }

        // 3. Look up user
        const user = await this.userHelper.getUserByEmail(data.email);
        if (!user) {
            throw new ValidationError("Invalid email or password");
        }

        // 4. Verify password
        const passwordHash = await this.userHelper.getPasswordHash(user.id);
        if (!passwordHash) {
            throw new ValidationError("Invalid email or password");
        }
        const valid = await bcrypt.compare(data.password, passwordHash);
        if (!valid) {
            throw new ValidationError("Invalid email or password");
        }

        // 5. Handle Tenancy
        let selectedTenantId: number | undefined;

        if (data.school_slug) {
            // Specific school requested
            const tenant = await this.userHelper.getTenantBySlug(data.school_slug);
            if (!tenant) {
                throw new ValidationError("Invalid School ID");
            }

            // Check if user has roles in this tenant
            const userRoles = await this.userHelper.getUserRoles(user.id);
            const rolesInTenant = userRoles.filter(r => r.tenant_id === tenant.id);

            if (rolesInTenant.length === 0) {
                throw new ValidationError("This user is not registered at " + tenant.name);
            }

            selectedTenantId = tenant.id;
        } else {
            // No school requested - find user's schools
            const tenants = await this.userHelper.getUserTenants(user.id);

            if (tenants.length === 0) {
                // If no tenants, check for global roles (tenant_id IS NULL)
                const userRoles = await this.userHelper.getUserRoles(user.id);
                const hasGlobalRole = userRoles.some(r => r.tenant_id === null);

                if (!hasGlobalRole) {
                    throw new ValidationError("No schools associated with this account.");
                }
                // Global admin, selectedTenantId remains undefined
            } else if (tenants.length > 1) {
                return {
                    status: 'MULTIPLE_TENANTS',
                    tenants: tenants.map(t => ({
                        id: t.id,
                        uuid: t.uuid,
                        name: t.name,
                        slug: t.slug
                    }))
                };
            } else {
                // Exactly one tenant
                selectedTenantId = tenants[0].id;
            }
        }

        // 6. Fetch all roles for this user (filtered by tenant if selected)
        const allRoles = await this.userHelper.getUserRoles(user.id);
        const roles = selectedTenantId
            ? allRoles.filter(r => r.tenant_id === selectedTenantId || r.tenant_id === null)
            : allRoles;

        const roleSlugs = roles.map(r => r.slug);
        const primaryRole = roles.find(r => r.is_primary) || roles[0];

        // 7. Aggregate all permissions (scopes) using the high-architecture method
        const permissions = await this.userHelper.getEffectivePermissions(user.id, selectedTenantId);
        const scopeString = permissions.join(' ');

        console.log(`[AuthService] Login successful. User: ${user.email}, Selected Tenant: ${selectedTenantId}`);
        console.log(`[AuthService] Scopes/Permissions: ${scopeString}`);

        // 8. Build token payload
        const payload: TokenPayload = {
            grant_type: data.grant_type,
            client_id: data.client_id,
            client_secret: data.client_secret,
            scope: scopeString, // Permissions are now the scope
            username: data.email,
            password: data.password,
            sub: String(user.id),
            email: user.email,
            role_id: primaryRole ? primaryRole.id : user.role_id,
            roles: roleSlugs,
            tenant_id: selectedTenantId,
        } as any;

        console.log(`[AuthService] Generated token payload:`, JSON.stringify(payload));

        // 8. Dispatch to the grant handler
        const handler = this.grantFactory.getHandler(data.grant_type);
        const tokenPair = await handler.handle(payload);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
        await this.userHelper.saveRefreshToken(user.id, 0, tokenPair.refresh_token, expiresAt);

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
        const permissions = await this.userHelper.getEffectivePermissions(user.id, tenantId);
        const scopeString = permissions.join(' ');

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
