type TokenPayload = {
    client_id: string;
    client_secret: string;
    grant_type?: string;
    scope?: string;
    redirect_uri?: string;
    code?: string;
    iat?: number;
    exp: number;
}

type TokenResponse = {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export { TokenPayload, TokenResponse }