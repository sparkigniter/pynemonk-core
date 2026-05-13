export interface AuthUserResponse {
    id: number;
    email: string;
    role_id: number;
}

export interface IAuthClient {
    /**
     * Create a new user in the identity provider.
     * This abstracts whether we are calling a local service or a remote microservice.
     */
    createUser(
        data: {
            email: string;
            password?: string;
            role_slug: string;
            tenant_id: number;
        },
        db?: any,
    ): Promise<AuthUserResponse>;

    /**
     * Get the role ID for a given slug in a tenant.
     */
    getRoleId(tenantId: number, roleSlug: string): Promise<number>;

    /**
     * Update an existing user.
     */
    updateUser(
        userId: number,
        data: {
            email?: string;
            first_name?: string;
            last_name?: string;
        }
    ): Promise<void>;
}
