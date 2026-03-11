/**
 * Authentication Store (Zustand)
 * ==============================
 * Централизованное управление состоянием аутентификации.
 * 
 * Features:
 * - Persistent session management
 * - User state
 * - Loading states
 * - Auth actions (login, register, logout)
 */

import { create } from 'zustand';
import { account, ID, type Models } from '../lib/appwrite';

// ============================================================================
// Types
// ============================================================================

export interface User {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  phone: string;
  phoneVerification: boolean;
  createdAt: string;
}

interface AuthState {
  /** Current authenticated user */
  user: User | null;
  
  /** Session object */
  session: Models.Session | null;
  
  /** Loading state for initial auth check */
  isLoading: boolean;
  
  /** Loading state for auth actions */
  isActionLoading: boolean;
  
  /** Error message */
  error: string | null;
  
  /** Whether initial auth check is complete */
  isInitialized: boolean;
}

interface AuthActions {
  /** Initialize auth state (check existing session) */
  initialize: () => Promise<void>;
  
  /** Login with email and password */
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  /** Register new user */
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  /** Logout current user */
  logout: () => Promise<void>;
  
  /** Clear error */
  clearError: () => void;
  
  /** Refresh user data */
  refreshUser: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform Appwrite user model to our User type
 */
const transformUser = (appwriteUser: Models.User<Models.Preferences>): User => ({
  $id: appwriteUser.$id,
  email: appwriteUser.email,
  name: appwriteUser.name || appwriteUser.email.split('@')[0],
  emailVerification: appwriteUser.emailVerification,
  phone: appwriteUser.phone,
  phoneVerification: appwriteUser.phoneVerification,
  createdAt: appwriteUser.$createdAt,
});

/**
 * Map Appwrite error codes to user-friendly messages
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid credentials') || message.includes('invalid email')) {
      return 'Неверный email или пароль';
    }
    if (message.includes('user already exists') || message.includes('already been registered')) {
      return 'Пользователь с таким email уже существует';
    }
    if (message.includes('password')) {
      return 'Пароль должен содержать минимум 8 символов';
    }
    if (message.includes('rate limit')) {
      return 'Слишком много попыток. Попробуйте позже';
    }
    if (message.includes('network')) {
      return 'Ошибка сети. Проверьте подключение к интернету';
    }
    
    return error.message;
  }
  
  return 'Произошла неизвестная ошибка';
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useAuthStore = create<AuthStore>((set) => ({
  // Initial state
  user: null,
  session: null,
  isLoading: true,
  isActionLoading: false,
  error: null,
  isInitialized: false,

  // Actions
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const appwriteUser = await account.get();
      const user = transformUser(appwriteUser);
      
      set({ 
        user, 
        isLoading: false, 
        isInitialized: true 
      });
    } catch {
      // No active session - this is expected for logged out users
      set({ 
        user: null, 
        session: null, 
        isLoading: false, 
        isInitialized: true 
      });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isActionLoading: true, error: null });
      
      // Create email/password session
      await account.createEmailPasswordSession(email, password);
      
      // Fetch user data
      const appwriteUser = await account.get();
      const user = transformUser(appwriteUser);
      
      set({ 
        user, 
        isActionLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ 
        isActionLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      set({ isActionLoading: true, error: null });
      
      // Create new user account
      await account.create(ID.unique(), email, password, name);
      
      // Automatically log in after registration
      await account.createEmailPasswordSession(email, password);
      
      // Fetch user data
      const appwriteUser = await account.get();
      const user = transformUser(appwriteUser);
      
      set({ 
        user, 
        isActionLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ 
        isActionLoading: false, 
        error: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      set({ isActionLoading: true, error: null });
      
      await account.deleteSession('current');
      
      set({ 
        user: null, 
        session: null, 
        isActionLoading: false 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local state
      set({ 
        user: null, 
        session: null, 
        isActionLoading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  refreshUser: async () => {
    try {
      const appwriteUser = await account.get();
      const user = transformUser(appwriteUser);
      set({ user });
    } catch {
      set({ user: null, session: null });
    }
  },
}));

// ============================================================================
// Selector Hooks
// ============================================================================

/** Check if user is authenticated */
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);

/** Get current user */
export const useUser = () => useAuthStore((state) => state.user);

/** Get loading state */
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

/** Get action loading state */
export const useAuthActionLoading = () => useAuthStore((state) => state.isActionLoading);

/** Get auth error */
export const useAuthError = () => useAuthStore((state) => state.error);
