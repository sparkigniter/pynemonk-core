import { createContext, useCallback, useContext, useEffect, useState } from 'react';
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
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
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
        // Discard if access token is expired
        if (Date.now() >= s.expiresAt) return null;
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
        return { sub: payload.sub, email: payload.email, role_id: payload.role_id };
    } catch {
        return null;
    }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const stored = loadSession();
        if (stored) setSession(stored);
        setLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const tokens = await authApi.login({ email, password, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'password' });

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
    }, []);

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

    return (
        <AuthContext.Provider value={{
            user: session?.user ?? null,
            isAuthenticated: session !== null,
            isLoading,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
