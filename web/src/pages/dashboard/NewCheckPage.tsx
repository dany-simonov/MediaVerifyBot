/**
 * New Check Page
 * ==============
 * Страница для создания новой проверки с Drag & Drop и табами.
 */

import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileImage, FileText, Send, Loader2 } from 'lucide-react';
import { Card, CardHeader, Button, Alert } from '../../components/ui';
import { FileDropzone, TextInput } from '../../components/upload';
import { cn } from '../../lib/utils';
import type { UploadFile, TabType } from '../../types';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  {
    id: 'media',
    label: 'Медиафайлы',
    icon: <FileImage className="w-4 h-4" />,
  },
  {
    id: 'text',
    label: 'Вставить текст',
    icon: <FileText className="w-4 h-4" />,
  },
];

export function NewCheckPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabType) || 'media';
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ message: string } | null>(null);

  // Handle tab change
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setResult(null);
  };

  // Handle files selection
  const handleFilesSelected = useCallback((newFiles: UploadFile[]) => {
    setFiles((prev) => [...prev, ...newFiles].slice(0, 10));
    setResult(null);
  }, []);

  // Handle file removal
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Handle text change
  const handleTextChange = useCallback((value: string) => {
    setText(value);
    setResult(null);
  }, []);

  // Check if can submit
  const canSubmit = activeTab === 'media' 
    ? files.length > 0 && files.every((f) => f.status === 'pending')
    : text.length >= 50;

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setIsAnalyzing(true);
    
    try {
      // TODO: Implement actual analysis
      // For now, simulate loading
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setResult({
        message: 'Анализ выполнен! Интеграция с бэкендом скоро будет добавлена.',
      });
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-mv-text">Новая проверка</h1>
        <p className="mt-1 text-mv-text-secondary">
          Загрузите медиафайлы или вставьте текст для анализа
        </p>
      </div>

      {/* Main Card */}
      <Card padding="none" className="overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-mv-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-mv-accent'
                  : 'text-mv-text-secondary hover:text-mv-text',
                isAnalyzing && 'pointer-events-none opacity-50'
              )}
            >
              {tab.icon}
              {tab.label}
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-mv-accent" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'media' ? (
            <FileDropzone
              files={files}
              onFilesSelected={handleFilesSelected}
              onRemoveFile={handleRemoveFile}
              disabled={isAnalyzing}
            />
          ) : (
            <TextInput
              value={text}
              onChange={handleTextChange}
              disabled={isAnalyzing}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-mv-surface-2 border-t border-mv-border flex items-center justify-between">
          <p className="text-sm text-mv-text-muted">
            {activeTab === 'media' 
              ? `${files.length} файл(ов) выбрано`
              : `${text.length} символов`
            }
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

      {/* Result */}
      {result && (
        <Alert variant="success" title="Результат">
          {result.message}
        </Alert>
      )}

      {/* Tips Card */}
      <Card variant="outlined" className="bg-mv-surface-2/30">
        <CardHeader
          title="💡 Как работает проверка"
          description="Наши ИИ-модели анализируют контент и определяют вероятность его создания нейросетью"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-mv-surface border border-mv-border">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-medium text-mv-text mb-1">Загрузка</h4>
            <p className="text-sm text-mv-text-muted">
              Перетащите файлы или вставьте текст
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-mv-surface border border-mv-border">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-medium text-mv-text mb-1">Анализ</h4>
            <p className="text-sm text-mv-text-muted">
              ИИ определяет признаки генерации
            </p>
          </div>
          
          <div className="p-4 rounded-lg bg-mv-surface border border-mv-border">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-medium text-mv-text mb-1">Результат</h4>
            <p className="text-sm text-mv-text-muted">
              Получите вердикт и индекс подлинности
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
