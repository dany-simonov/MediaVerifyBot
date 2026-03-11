/**
 * Appwrite Client Configuration
 * =============================
 * Централизованная конфигурация для Appwrite Cloud.
 * 
 * @see https://appwrite.io/docs
 */

import { Client, Account, Databases, Storage, Functions, type Models } from 'appwrite';

// ============================================================================
// Environment Configuration
// ============================================================================

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '69a9d60e00230f1aceb2';

// ============================================================================
// Client Initialization
// ============================================================================

/**
 * Singleton Appwrite Client instance
 */
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// ============================================================================
// Service Exports
// ============================================================================

/** Account service for auth operations */
export const account = new Account(client);

/** Databases service for data operations */
export const databases = new Databases(client);

/** Storage service for file operations */
export const storage = new Storage(client);

/** Functions service for serverless operations */
export const functions = new Functions(client);

// ============================================================================
// Database Configuration
// ============================================================================

/**
 * Appwrite resource identifiers
 */
export const APPWRITE_CONFIG = {
  /** Main database ID */
  databaseId: '69af34d60006b11ddee4',
  
  /** Collections */
  collections: {
    checks: 'checks',
    users: 'users',
  },
  
  /** Storage buckets */
  buckets: {
    uploads: 'uploads',
  },
  
  /** Serverless functions */
  functions: {
    analyze: 'analyze',
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export { ID } from 'appwrite';
export type { Models };

// ============================================================================
// Client Export (for advanced usage)
// ============================================================================

export { client };
