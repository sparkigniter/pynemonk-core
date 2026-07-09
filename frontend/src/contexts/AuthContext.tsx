import { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react';
import * as authApi from '../api/auth.api';

// ── OAuth client credentials ─────────────────────────────────────────────────
// These identify the frontend application to the auth server.
// In production, read from env variables.
const CLIENT_ID = (import.meta as any).env?.VITE_CLIENT_ID ?? 'frontend_client';
const CLIENT_SECRET = (import.meta as any).env?.VITE_CLIENT_SECRET ?? 'frontend_secret';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
    sub: string;        // user id
    email: string;
    role_id: number;
    roles: string[];    // role slugs
    permissions: string[]; // specific permission keys (scopes)
    tenant_id?: number;
    student_profile?: {
        id: number;
        classroom_id?: number;
        classroom_name?: string;
    };
}

interface AuthSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;  // Unix timestamp (ms)
    user: AuthUser;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    tenants: authApi.TenantInfo[];
    tenantFetchError: string | null;
    login: (email: string, password: string, schoolSlug?: string) => Promise<authApi.LoginResult>;
    logout: () => Promise<void>;
    refreshTenants: () => Promise<void>;
    can: (permission: string) => boolean;
    accessToken: string | null;
}

// ── Storage helpers ──────────────────────────────────────────────────────────

const SESSION_KEY = 'eduerp_session';

function saveSession(session: AuthSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession(): AuthSession | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw) as AuthSession;
        
        // Safety: Ensure user object has permissions array for backward compatibility
        if (s.user && !s.user.permissions) {
            s.user.permissions = [];
        }
        
        return s;
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function parseUser(accessToken: string): AuthUser | null {
    try {
        // JWT payload is the second base64url segment
        const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return { 
            sub: payload.sub, 
            email: payload.email, 
            role_id: payload.role_id,
            roles: payload.roles || [],
            permissions: typeof payload.scope === 'string' ? payload.scope.split(' ') : [],
            tenant_id: payload.tenant_id,
            student_profile: payload.student_profile
        };
    } catch {
        return null;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    tenants: [],
    tenantFetchError: null,
    login: async () => { return {} as any; },
    logout: async () => { },
    refreshTenants: async () => { },
    can: () => false,
    accessToken: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [tenants, setTenants] = useState<authApi.TenantInfo[]>([]);
    const [isLoading, setLoading] = useState(true);
    const [tenantFetchError, setTenantFetchError] = useState<string | null>(null);
    const retryRef = useRef(0);

    const refreshTenants = useCallback(async (token?: string) => {
        const t = token || session?.accessToken;
        if (!t) return;
        
        if (retryRef.current >= 5) {
            console.error('Max retries reached for tenant discovery');
            setTenantFetchError('Failed to load your schools after multiple attempts. Please try logging out and in again.');
            return;
        }

        try {
            setTenantFetchError(null);
            const list = await authApi.getMyTenants(t);
            setTenants(list);
            retryRef.current = 0; // Reset on success
        } catch (err: any) {
            console.error('Failed to fetch tenants', err);
            retryRef.current += 1;
            
            // If it's a 500 or network error, it might be temporary, 
            // but for "Server misconfiguration" we should probably stop soon.
            if (retryRef.current >= 5) {
                setTenantFetchError(err?.message || 'Could not connect to school service');
            } else {
                // Exponential backoff or simple delay
                setTimeout(() => refreshTenants(t), 1000 * retryRef.current);
            }
        }
    }, [session]);

    // Restore session from localStorage on mount
    useEffect(() => {
        const stored = loadSession();
        if (stored) {
            if (Date.now() >= stored.expiresAt) {
                // Access token is expired, trigger refresh
                authApi.refreshTokens(stored.refreshToken, CLIENT_ID, CLIENT_SECRET)
                    .then(tokens => {
                        const user = parseUser(tokens.access_token);
                        if (user) {
                            const newSession: AuthSession = {
                                accessToken: tokens.access_token,
                                refreshToken: tokens.refresh_token || stored.refreshToken,
                                expiresAt: Date.now() + tokens.expires_in * 1000,
                                user,
                            };
                            saveSession(newSession);
                            setSession(newSession);
                            authApi.getMyTenants(tokens.access_token)
                                .then(setTenants)
                                .catch(err => console.error('Failed to fetch tenants after refresh on mount', err));
                        } else {
                            clearSession();
                        }
                    })
                    .catch(err => {
                        console.error('Failed to refresh tokens on mount', err);
                        clearSession();
                    })
                    .finally(() => {
                        setLoading(false);
                    });
                return;
            } else {
                setSession(stored);
                // Use local variable to avoid dependency on 'session' state
                authApi.getMyTenants(stored.accessToken)
                    .then(setTenants)
                    .catch(err => console.error('Failed to fetch tenants on mount', err));
            }
        }
        setLoading(false);
    }, []); // Run ONLY once on mount

    const login = useCallback(async (email: string, password: string, schoolSlug?: string): Promise<authApi.LoginResult> => {
        const payload: authApi.LoginPayload = { 
            email, 
            password, 
            client_id: CLIENT_ID, 
            client_secret: CLIENT_SECRET, 
            grant_type: 'password' 
        };

        if (schoolSlug && schoolSlug.trim() !== '' && schoolSlug !== 'undefined' && schoolSlug !== 'null') {
            payload.school_slug = schoolSlug;
        }

        const result = await authApi.login(payload);

        if ('status' in result && result.status === 'MULTIPLE_TENANTS') {
            return result;
        }

        const tokens = result as authApi.TokenResponse;
        const user = parseUser(tokens.access_token);
        if (!user) throw new Error('Invalid token received from server');

        const newSession: AuthSession = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
            user,
        };

        saveSession(newSession);
        setSession(newSession);
        
        // Fetch tenants after successful login
        refreshTenants(tokens.access_token);
        
        return result;
    }, [refreshTenants]);

    const logout = useCallback(async () => {
        if (session?.accessToken) {
            try {
                await authApi.logout(session.accessToken);
            } catch {
                // Best-effort — clear locally even if server call fails
            }
        }
        clearSession();
        setSession(null);
    }, [session]);

    const can = useCallback((requestedPermission: string) => {
        if (!session?.user?.permissions) return false;
        
        // 1. Direct match (exact permission match)
        if (session.user.permissions.includes(requestedPermission)) return true;

        // 2. Parse the requested permission (e.g. 'student:write')
        const [reqResource, reqAction] = requestedPermission.split(':');
        if (!reqAction) {
            // Fallback for simple scopes
            return session.user.permissions.some(p => p === requestedPermission || p.startsWith(`${requestedPermission}:`));
        }

        // 3. Implied scope matching
        const ACTION_WEIGHTS: Record<string, number> = {
            'admin': 100,
            'write': 50,
            'read': 10,
        };

        const reqWeight = ACTION_WEIGHTS[reqAction] || 0;
        return session.user.permissions.some(userPerm => {
            const [userResource, userAction] = userPerm.split(':');
            if (userResource !== reqResource) return false;
            const userWeight = ACTION_WEIGHTS[userAction] || 0;
            return userWeight >= reqWeight;
        });
    }, [session]);

    return (
        <AuthContext.Provider value={{
            user: session?.user ?? null,
            isAuthenticated: session !== null,
            isLoading,
            tenants,
            tenantFetchError,
            login,
            logout,
            refreshTenants,
            can,
            accessToken: session?.accessToken ?? null,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
