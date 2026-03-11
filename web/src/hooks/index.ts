/**
 * Hooks Exports
 * =============
 */

// Legacy hooks (kept for backward compatibility)
export { useAuth } from './useAuth';
export { useAnalyze } from './useAnalyze';

// Re-export store hooks (preferred way)
export { 
  useAuthStore,
  useIsAuthenticated,
  useUser,
  useAuthLoading,
  useAuthActionLoading,
  useAuthError
} from '../store';
