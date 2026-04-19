// ─────────────────────────────────────────────────────────────────────────────
// Base — fields every grant shares
// ─────────────────────────────────────────────────────────────────────────────
interface BaseTokenPayload {
    grant_type: string;
    client_id: string;
    client_secret: string;
    scope?: string;
    iat?: number;
    exp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-grant payload types
// ─────────────────────────────────────────────────────────────────────────────

/** Resource Owner Password Credentials (RFC 6749 §4.3) */
export interface PasswordGrantPayload extends BaseTokenPayload {
    grant_type: 'password';
    username: string;       // email used as username
    password?: string;      // only present before token is minted; stripped from JWT
    sub: string;            // user id (string)
    email: string;
    role_id: number;        // primary role id
    roles: string[];        // list of role slugs (e.g. ['principal', 'teacher'])
    tenant_id?: number;
}

/** Client Credentials — machine-to-machine, no user context (RFC 6749 §4.4) */
export interface ClientCredentialsPayload extends BaseTokenPayload {
    grant_type: 'client_credentials';
    // No sub / email — this token represents the CLIENT, not a user
}

/** Authorization Code (RFC 6749 §4.1) */
export interface AuthorizationCodePayload extends BaseTokenPayload {
    grant_type: 'authorization_code';
    code: string;
    redirect_uri: string;
    sub: string;
    email: string;
    role_id: number;
    tenant_id?: number;
}

/** Refresh Token Rotation (RFC 6749 §6) */
export interface RefreshTokenPayload extends BaseTokenPayload {
    grant_type: 'refresh_token';
    refresh_token: string;
    sub: string;
    email: string;
    role_id: number;
    tenant_id?: number;
}

/** Implicit (RFC 6749 §4.2 — legacy, avoid in new apps) */
export interface ImplicitGrantPayload extends BaseTokenPayload {
    grant_type: 'implicit';
    redirect_uri: string;
    response_type: string;
    sub: string;
    email: string;
    role_id: number;
    tenant_id?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Discriminated union — the single type used across the system
// ─────────────────────────────────────────────────────────────────────────────
export type TokenPayload =
    | PasswordGrantPayload
    | ClientCredentialsPayload
    | AuthorizationCodePayload
    | RefreshTokenPayload
    | ImplicitGrantPayload;

// ─────────────────────────────────────────────────────────────────────────────
// Token response
// ─────────────────────────────────────────────────────────────────────────────
export type TokenResponse = {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}