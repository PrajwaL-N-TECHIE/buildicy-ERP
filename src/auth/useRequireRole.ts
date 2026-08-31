import { useAuth } from '@/context/AuthContext';
import type { RoleTier } from '@/types';

/**
 * Returns true if the current user's role tier is in `allowed`.
 *
 * Usage:
 *   const canSeeAdminPanel = useRequireRole(['admin']);
 *   if (!canSeeAdminPanel) return <Forbidden />;
 */
export function useRequireRole(allowed: RoleTier[]): boolean {
  const { roleTier } = useAuth();
  if (!roleTier) return false;
  return allowed.includes(roleTier);
}
