import { useState } from 'react';
import { storage, functions, ID, APPWRITE_CONFIG } from '../lib/appwrite';
import type { AnalyzeResult, MediaType } from '../types';

export function useAnalyze() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectMediaType = (file: File): MediaType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'text';
  };

  const analyzeFile = async (file: File, userId?: string): Promise<AnalyzeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Upload file to Storage
      const uploaded = await storage.createFile(
        APPWRITE_CONFIG.uploadsBucketId,
        ID.unique(),
        file
      );

      // Call analyze function
      const result = await functions.createExecution(
        APPWRITE_CONFIG.analyzeFunctionId,
        JSON.stringify({
          fileId: uploaded.$id,
          mediaType: detectMediaType(file),
          userId: userId || 'anonymous',
        })
      );

      const data = JSON.parse(result.responseBody);
      
      // Clean up uploaded file
      try {
        await storage.deleteFile(APPWRITE_CONFIG.uploadsBucketId, uploaded.$id);
      } catch {
        // Ignore cleanup errors
      }

      return data as AnalyzeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка анализа';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeText = async (text: string, userId?: string): Promise<AnalyzeResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await functions.createExecution(
        APPWRITE_CONFIG.analyzeFunctionId,
        JSON.stringify({
          text,
          mediaType: 'text',
          userId: userId || 'anonymous',
        })
      );

      const data = JSON.parse(result.responseBody);
      return data as AnalyzeResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка анализа';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeFile, analyzeText, loading, error };
}
