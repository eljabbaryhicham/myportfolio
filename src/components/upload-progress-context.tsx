'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ProviderState = { isUploading: boolean; progress: number; fileName: string };

type UploadProgressState = {
  vercel: ProviderState;
  cloudinary: ProviderState;
  activeMediaTab: string | null;
  // Back-compat single-upload view (for consumers that expect the old shape)
  isUploading: boolean;
  progress: number;
  fileName: string;
  provider: 'vercel' | 'cloudinary' | null;
};

type CompletedUpload = {
  docId: string;
  resourceType: 'image' | 'video' | 'raw';
  libraryId: 'primary' | 'extented';
} | null;

type UploadProgressContextType = UploadProgressState & {
  setUploadProgress: (state: Partial<UploadProgressState>) => void;
  startUpload: (fileName: string, provider: 'vercel' | 'cloudinary') => void;
  updateProgress: (progress: number, provider?: 'vercel' | 'cloudinary') => void;
  finishUpload: (provider?: 'vercel' | 'cloudinary') => void;
  setActiveMediaTab: (tab: string | null) => void;
  completedUpload: CompletedUpload;
  signalCompletedUpload: (docId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => void;
  consumeCompletedUpload: () => void;
};

const UploadProgressContext = createContext<UploadProgressContextType | null>(null);

export function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadProgressState>({
    vercel: { isUploading: false, progress: 0, fileName: '' },
    cloudinary: { isUploading: false, progress: 0, fileName: '' },
    activeMediaTab: null,
    isUploading: false,
    progress: 0,
    fileName: '',
    provider: null,
  });

  const [completedUpload, setCompletedUpload] = useState<CompletedUpload>(null);

  const setUploadProgress = useCallback((partial: Partial<UploadProgressState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const startUpload = useCallback((fileName: string, provider: 'vercel' | 'cloudinary') => {
    setState((prev) => ({
      ...prev,
      [provider]: { isUploading: true, progress: 0, fileName },
      isUploading: true,
      progress: 0,
      fileName,
      provider,
    }));
  }, []);

  const updateProgress = useCallback((progress: number, provider?: 'vercel' | 'cloudinary') => {
    setState((prev) => {
      const target = provider || prev.provider;
      if (!target) return { ...prev, progress };
      return {
        ...prev,
        [target]: { ...prev[target], progress },
        ...(prev.provider === target ? { progress } : {}),
      };
    });
  }, []);

  const finishUpload = useCallback((provider?: 'vercel' | 'cloudinary') => {
    setState((prev) => {
      const target = provider || prev.provider;
      if (!target) return { ...prev, isUploading: false, progress: 0, fileName: '', provider: null };
      const next = {
        ...prev,
        [target]: { isUploading: false, progress: 0, fileName: '' },
      };
      // Clear legacy single-upload view if it was for this provider
      if (prev.provider === target) {
        next.isUploading = next.vercel.isUploading || next.cloudinary.isUploading;
        if (!next.isUploading) {
          next.progress = 0;
          next.fileName = '';
          next.provider = null;
        } else {
          // Keep the other provider's info in legacy view
          const other = target === 'vercel' ? 'cloudinary' : 'vercel';
          if (next[other].isUploading) {
            next.progress = next[other].progress;
            next.fileName = next[other].fileName;
            next.provider = other as any;
          }
        }
      }
      return next;
    });
  }, []);

  const setActiveMediaTab = useCallback((tab: string | null) => {
    setState((prev) => ({ ...prev, activeMediaTab: tab }));
  }, []);

  const signalCompletedUpload = useCallback((docId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented') => {
    setCompletedUpload({ docId, resourceType, libraryId });
  }, []);

  const consumeCompletedUpload = useCallback(() => {
    setCompletedUpload(null);
  }, []);

  return (
    <UploadProgressContext.Provider value={{ ...state, setUploadProgress, startUpload, updateProgress, finishUpload, setActiveMediaTab, completedUpload, signalCompletedUpload, consumeCompletedUpload }}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) throw new Error('useUploadProgress must be used within UploadProgressProvider');
  return ctx;
}
