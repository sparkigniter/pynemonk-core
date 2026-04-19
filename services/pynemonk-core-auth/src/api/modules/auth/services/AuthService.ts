import { injectable, inject } from "tsyringe";
import bcrypt from "bcrypt";
import UserHelper from "../helpers/UserHelper.js";
import UserValidator from "../validator/UserValidator.js";
import ValidationError from "../../../errors/ValidationError.js";
import OauthClientHelper from "../../oauth2/helpers/OauthClientHelper.js";
import GrantHandlerFactory from "../../oauth2/factory/GrantHandlerFactory.js";
import type { RegisterUserRequest, LoginRequest, UserRecord } from "../../../../types/User.js";
import type { TokenResponse, TokenPayload } from "../../../../types/Token.js";

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
        };
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Validates client + user credentials, then dispatches token generation
     * to the appropriate grant handler based on the requested grant_type.
     */
    public async login(data: LoginRequest): Promise<TokenResponse> {
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

        // 3b. Fetch all roles for this user
        const roles = await this.userHelper.getUserRoles(user.id);
        const roleSlugs = roles.map(r => r.slug);
        const primaryRole = roles.find(r => r.is_primary) || roles[0];

        // 4. Verify password
        const passwordHash = await this.userHelper.getPasswordHash(user.id);
        if (!passwordHash) {
            throw new ValidationError("Invalid email or password");
        }
        const valid = await bcrypt.compare(data.password, passwordHash);
        if (!valid) {
            throw new ValidationError("Invalid email or password");
        }

        // 5. Build token payload — grant_type comes from the request
        const payload: TokenPayload = {
            grant_type: data.grant_type,
            client_id: data.client_id,
            client_secret: data.client_secret,
            scope: data.scope,
            username: data.email, // OAuth2 expects 'username'
            password: data.password,
            // Custom claims — carried in the JWT
            sub: String(user.id),
            email: user.email,
            role_id: primaryRole ? primaryRole.id : user.role_id,
            roles: roleSlugs,
        } as any;

        // 6. Dispatch to the grant handler chosen by the caller
        const handler = this.grantFactory.getHandler(data.grant_type);
        const tokenPair = await handler.handle(payload);

        // 7. Persist refresh token for rotation / revocation
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
        await this.userHelper.saveRefreshToken(user.id, 0, tokenPair.refreshToken, expiresAt);

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

        const payload: TokenPayload = {
            grant_type: 'refresh_token',
            client_id: data.client_id,
            client_secret: data.client_secret,
            exp: Math.floor(Date.now() / 1000) + 3600,
            sub: String(user.id),
            email: user.email,
            role_id: user.role_id,
        } as any;

        const handler = this.grantFactory.getHandler('refresh_token');
        const tokenPair = await handler.handle(payload);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);
        await this.userHelper.saveRefreshToken(user.id, 0, tokenPair.refreshToken, expiresAt);

        return tokenPair;
    }

    // ─── Logout ───────────────────────────────────────────────────────────────

    /**
     * Revokes all refresh tokens for the user (full logout).
     */
    public async logout(userId: number): Promise<void> {
        await this.userHelper.revokeAllUserRefreshTokens(userId);
    }
}

export default AuthService;
