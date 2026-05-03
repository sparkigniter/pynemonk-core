import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to check if the current user has specific permissions or roles.
 */
export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permissions: string | string[]) => {
    if (!user) return false;
    const required = Array.isArray(permissions) ? permissions : [permissions];
    return required.some(p => user.permissions.includes(p));
  };

  const hasRole = (roles: string | string[]) => {
    if (!user) return false;
    const required = Array.isArray(roles) ? roles : [roles];
    return required.some(r => user.roles.includes(r));
  };

  return { hasPermission, hasRole, user };
};

interface CanProps {
  perform: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Declarative component to wrap elements that require specific permissions.
 */
export const Can: React.FC<CanProps> = ({ perform, children, fallback = null }) => {
  const { hasPermission } = usePermission();

  if (hasPermission(perform)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
