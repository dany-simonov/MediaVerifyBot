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
const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '69af34d60006b11ddee4';
const APPWRITE_UPLOADS_BUCKET_ID = import.meta.env.VITE_APPWRITE_UPLOADS_BUCKET_ID || 'uploads';
const APPWRITE_ANALYZE_FUNCTION_ID =
  import.meta.env.VITE_APPWRITE_ANALYZE_FUNCTION_ID || '69af3c9100376fedb9fd';

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
  databaseId: APPWRITE_DATABASE_ID,
  
  /** Collections */
  collections: {
    checks: 'checks',
    users: 'users',
  },
  
  /** Storage buckets */
  buckets: {
    uploads: APPWRITE_UPLOADS_BUCKET_ID,
  },
  
  /** Serverless functions */
  functions: {
    analyze: APPWRITE_ANALYZE_FUNCTION_ID,
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
