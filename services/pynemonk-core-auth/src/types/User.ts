/** Shared user types used across the auth module */

export interface UserRecord {
    id: number;
    tenant_id: number;
    email: string;
    role_id: number;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface UserProfileRecord {
    id: number;
    user_id: number;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    date_of_birth: Date | null;
}

export interface RegisterUserRequest {
    email: string;
    password: string;
    role_id: number;
    tenant_id: number;
    first_name?: string;
    last_name?: string;
    phone?: string;
}

export interface LoginRequest {
    client_id: string;
    client_secret: string;
    grant_type: string;
    email: string;
    password: string;
    school_slug?: string;
    scope?: string;
}

export interface IntrospectRequest {
    token: string;
}
