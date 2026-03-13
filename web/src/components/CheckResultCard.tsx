/**
 * Check Result Card Component
 * ===========================
 * Displays the results of a media analysis.
 */
import { VerdictBadge, ConfidenceGauge } from '.';
import { Card } from './ui';
import type { CheckResult } from '../types';

interface CheckResultCardProps {
  result: CheckResult;
}

export function CheckResultCard({ result }: CheckResultCardProps) {
  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Gauge */}
        <div className="flex-shrink-0 mx-auto">
          <ConfidenceGauge value={result.confidence} verdict={result.verdict} />
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg font-bold text-mv-text">Вердикт:</span>
            <VerdictBadge verdict={result.verdict} />
          </div>
          
          <p className="text-mv-text-secondary mb-4">{result.explanation}</p>

          <div className="text-sm space-y-2 text-mv-text-secondary">
            <div className="flex justify-between">
              <span>Модель:</span>
              <span className="font-mono text-mv-text">{result.model_used}</span>
            </div>
            <div className="flex justify-between">
              <span>Время обработки:</span>
              <span className="font-mono text-mv-text">{result.processing_ms} мс</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
