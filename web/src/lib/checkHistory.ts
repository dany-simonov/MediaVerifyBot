import type { Check, CheckResult, MediaType } from '../types';

const HISTORY_PREFIX = 'mv_checks';
const MAX_ITEMS = 200;

const getStorageKey = (userId: string) => `${HISTORY_PREFIX}:${userId}`;

const clampConfidence = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 1) return Math.round(value * 100);
  return Math.round(value);
};

export function loadChecksHistory(userId: string): Check[] {
  if (!userId) return [];

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Check => {
        return !!item && typeof item === 'object' && typeof item.id === 'string';
      })
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveCheckToHistory(
  userId: string,
  result: CheckResult,
  mediaType: MediaType,
  sourceLabel: string
): Check {
  const item: Check = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    media_type: mediaType,
    verdict: result.verdict,
    confidence: clampConfidence(result.confidence),
    model_used: result.model_used,
    explanation: sourceLabel || result.explanation,
    processing_ms: result.processing_ms,
    created_at: new Date().toISOString(),
  };

  const current = loadChecksHistory(userId);
  const next = [item, ...current].slice(0, MAX_ITEMS);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
  return item;
}
