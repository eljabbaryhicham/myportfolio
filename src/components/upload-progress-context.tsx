'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

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
  libraryId: 'primary' | 'extented' | 'vercel_blob';
} | null;

const COMPLETED_UPLOAD_KEY = 'mv_completed_upload';

type UploadProgressContextType = UploadProgressState & {
  setUploadProgress: (state: Partial<UploadProgressState>) => void;
  startUpload: (fileName: string, provider: 'vercel' | 'cloudinary') => void;
  updateProgress: (progress: number, provider?: 'vercel' | 'cloudinary') => void;
  finishUpload: (provider?: 'vercel' | 'cloudinary') => void;
  clearFileName: (provider: 'vercel' | 'cloudinary') => void;
  setActiveMediaTab: (tab: string | null) => void;
  completedUpload: CompletedUpload;
  signalCompletedUpload: (docId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented' | 'vercel_blob') => void;
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

  const [completedUpload, setCompletedUpload] = useState<CompletedUpload>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(COMPLETED_UPLOAD_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

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
      if (!target) return { ...prev, isUploading: false, progress: 0, provider: null };
      const next = {
        ...prev,
        [target]: { ...prev[target], isUploading: false, progress: 0 },
      };
      if (prev.provider === target) {
        next.isUploading = next.vercel.isUploading || next.cloudinary.isUploading;
        if (!next.isUploading) {
          next.progress = 0;
          next.provider = null;
          // Keep fileName — the notification effect needs it to detect completion
        } else {
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

  const clearFileName = useCallback((provider: 'vercel' | 'cloudinary') => {
    setState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], fileName: '' },
      ...(prev.provider === provider ? { fileName: '' } : {}),
    }));
  }, []);

  const signalCompletedUpload = useCallback((docId: string, resourceType: 'image' | 'video' | 'raw', libraryId: 'primary' | 'extented' | 'vercel_blob') => {
    const data = { docId, resourceType, libraryId };
    setCompletedUpload(data);
    try { localStorage.setItem(COMPLETED_UPLOAD_KEY, JSON.stringify(data)); } catch {}
  }, []);

  const consumeCompletedUpload = useCallback(() => {
    setCompletedUpload(null);
    try { localStorage.removeItem(COMPLETED_UPLOAD_KEY); } catch {}
  }, []);

  return (
    <UploadProgressContext.Provider value={{ ...state, setUploadProgress, startUpload, updateProgress, finishUpload, clearFileName, setActiveMediaTab, completedUpload, signalCompletedUpload, consumeCompletedUpload }}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) throw new Error('useUploadProgress must be used within UploadProgressProvider');
  return ctx;
}
