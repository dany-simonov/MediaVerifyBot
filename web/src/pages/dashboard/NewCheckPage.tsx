/**
 * New Check Page
 * ==============
 * Страница для создания новой проверки с Drag & Drop и табами.
 */

import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppwriteException } from 'appwrite';
import {
  FileImage, FileText, Send, Loader2, Lightbulb, UploadCloud, Cpu, ClipboardCheck
} from 'lucide-react';

import { Card, CardHeader, Button, Alert } from '../../components/ui';
import { FileDropzone, TextInput } from '../../components/upload';
import { CheckResultCard } from '../../components/CheckResultCard';
import { cn } from '../../lib/utils';
import { functions, storage, ID, APPWRITE_CONFIG } from '../../lib/appwrite';
import { saveCheckToHistory } from '../../lib/checkHistory';
import { useAuthStore } from '../../store';
import type { UploadFile, TabType, CheckResult } from '../../types';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: 'media', label: 'Медиафайлы', icon: <FileImage className="w-4 h-4" /> },
  { id: 'text', label: 'Вставить текст', icon: <FileText className="w-4 h-4" /> },
];

export function NewCheckPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'media';
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [text, setText] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  
  const { user } = useAuthStore();

  const detectMediaType = (file: File): CheckResult['media_type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'image';
  };

  const setFileStatus = (
    id: string,
    status: UploadFile['status'],
    progress: number,
    fileError?: string
  ) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status, progress, error: fileError } : f))
    );
  };

  const normalizeFunctionResult = (data: any, mediaType: CheckResult['media_type']): CheckResult => {
    const source = data?.result ?? data;
    const rawConfidence = Number(source?.confidence ?? 0);
    const aiProbability = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;
    const authenticityIndex = Math.max(0, Math.min(100, Math.round(100 - aiProbability)));

    return {
      verdict: source?.verdict ?? 'UNCERTAIN',
      confidence: authenticityIndex,
      model_used: source?.model_used ?? source?.model ?? 'Unknown model',
      explanation: source?.explanation ?? source?.reason ?? 'Результат получен без пояснения',
      processing_ms: Number(source?.processing_ms ?? source?.processingTime ?? 0),
      media_type: source?.media_type ?? mediaType,
    };
  };

  const mapAnalyzeError = (err: unknown): string => {
    if (err instanceof AppwriteException) {
      if (err.code === 401) return 'Нет доступа к функции анализа. Выполните вход снова.';
      if (err.code === 404) {
        const type = (err.type || '').toLowerCase();
        if (type.includes('bucket')) {
          return `Bucket не найден: ${APPWRITE_CONFIG.buckets.uploads}. Проверьте Storage -> Buckets в Appwrite.`;
        }
        if (type.includes('function')) {
          return `Function не найдена: ${APPWRITE_CONFIG.functions.analyze}. Проверьте Functions в Appwrite.`;
        }
        return 'Ресурс не найден в Appwrite (function или bucket).';
      }
      if (err.code === 429) return 'Слишком много запросов. Подождите и повторите.';
      return err.message || 'Ошибка Appwrite при анализе.';
    }
    if (err instanceof Error) return err.message;
    return 'Произошла неизвестная ошибка анализа.';
  };

  const resetState = () => {
    setError(null);
    setResult(null);
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    resetState();
  };

  const handleFilesSelected = useCallback((newFiles: UploadFile[]) => {
    setFiles((prev) => {
      prev.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      return newFiles.slice(0, 1);
    }); // Keep only one file and allow replacing the current one.
    resetState();
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    resetState();
  }, []);

  const canSubmit = activeTab === 'media' 
    ? files.length > 0 && files.every((f) => f.status !== 'uploading' && f.status !== 'analyzing')
    : text.length >= 50;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    
    setIsAnalyzing(true);
    resetState();

    try {
      let execution;
      let mediaType: CheckResult['media_type'] = 'text';
      let uploadedFileId: string | null = null;

      if (activeTab === 'media' && files.length > 0) {
        const fileRef = files[0];
        const fileToUpload = fileRef.file;
        mediaType = detectMediaType(fileToUpload);

        setFileStatus(fileRef.id, 'uploading', 35);
        
        // 1. Upload to Storage
        const uploadedFile = await storage.createFile(
          APPWRITE_CONFIG.buckets.uploads,
          ID.unique(),
          fileToUpload
        );
        uploadedFileId = uploadedFile.$id;
        setFileStatus(fileRef.id, 'analyzing', 70);

        // 2. Call analyze function
        const payload = {
          fileId: uploadedFile.$id,
          userId: user.$id,
          username: user.name,
          firstName: user.name.split(' ')[0] || '',
          mediaType,
        };
        execution = await functions.createExecution(APPWRITE_CONFIG.functions.analyze, JSON.stringify(payload));
      } else if (activeTab === 'text') {
        mediaType = 'text';
        const payload = {
          text,
          userId: user.$id,
          username: user.name,
          firstName: user.name.split(' ')[0] || '',
          mediaType,
        };
        execution = await functions.createExecution(APPWRITE_CONFIG.functions.analyze, JSON.stringify(payload));
      } else {
        throw new Error('Нет данных для анализа');
      }

      if (!execution.responseBody) {
        throw new Error('Функция не вернула ответ. Проверьте логи Appwrite Function.');
      }

      const resultData = JSON.parse(execution.responseBody);
      if (resultData.detail) {
        throw new Error(resultData.detail);
      }

      const normalizedResult = normalizeFunctionResult(resultData, mediaType);
      setResult(normalizedResult);

      if (user?.$id) {
        const sourceLabel =
          activeTab === 'media' && files[0]?.file?.name
            ? files[0].file.name
            : text.slice(0, 120);
        saveCheckToHistory(user.$id, normalizedResult, mediaType, sourceLabel);
      }

      if (activeTab === 'media' && files.length > 0) {
        setFileStatus(files[0].id, 'complete', 100);
      }

      // Best effort cleanup after successful analyze.
      if (uploadedFileId) {
        try {
          await storage.deleteFile(APPWRITE_CONFIG.buckets.uploads, uploadedFileId);
        } catch {
          // Ignore cleanup errors.
        }
      }

    } catch (e) {
      const message = mapAnalyzeError(e);
      setError(message);
      if (activeTab === 'media' && files.length > 0) {
        setFileStatus(files[0].id, 'error', 0, message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mv-text">Новая проверка</h1>
        <p className="mt-1 text-mv-text-secondary">Загрузите медиафайлы или вставьте текст для анализа</p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex border-b border-mv-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative',
                activeTab === tab.id ? 'text-mv-accent' : 'text-mv-text-secondary hover:text-mv-text',
                isAnalyzing && 'pointer-events-none opacity-50'
              )}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mv-accent" />}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'media' ? (
            <FileDropzone
              files={files}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              disabled={isAnalyzing}
              maxFiles={1}
            />
          ) : (
            <TextInput value={text} onChange={handleTextChange} disabled={isAnalyzing} />
          )}
        </div>

        <div className="px-6 py-4 bg-mv-surface-2 border-t border-mv-border flex items-center justify-between">
          <p className="text-sm text-mv-text-muted">
            {activeTab === 'media' ? `${files.length} файл(ов) выбрано` : `${text.length} символов`}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isAnalyzing}
            leftIcon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          >
            {isAnalyzing ? 'Анализ...' : 'Проверить'}
          </Button>
        </div>
      </Card>
      
      {error && <Alert variant="error" title="Ошибка анализа">{error}</Alert>}
      {result && <CheckResultCard result={result} />}

      <Card variant="outlined" className="bg-mv-surface-2/30">
        <CardHeader
          title="Как работает проверка"
          icon={<Lightbulb className="w-5 h-5" />}
          description="Наши ИИ-модели анализируют контент и определяют вероятность его создания нейросетью"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 pt-0">
          <div className="p-4 rounded-lg bg-mv-surface border border-mv-border">
            <div className="w-10 h-10 mb-3 rounded-lg bg-mv-accent/10 flex items-center justify-center text-mv-accent">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-mv-text mb-1">Загрузка</h4>
            <p className="text-sm text-mv-text-muted">Перетащите файлы или вставьте текст</p>
          </div>
          <div className="p-4 rounded-lg bg-mv-surface border border-mv-border">
            <div className="w-10 h-10 mb-3 rounded-lg bg-mv-accent/10 flex items-center justify-center text-mv-accent">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-mv-text mb-1">Анализ</h4>
            <p className="text-sm text-mv-text-muted">ИИ определяет признаки генерации</p>
          </div>
          <div className="p-4 rounded-lg bg-mv-surface border border-mv-border">
            <div className="w-10 h-10 mb-3 rounded-lg bg-mv-accent/10 flex items-center justify-center text-mv-accent">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <h4 className="font-medium text-mv-text mb-1">Результат</h4>
            <p className="text-sm text-mv-text-muted">Получите вердикт и индекс подлинности</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
