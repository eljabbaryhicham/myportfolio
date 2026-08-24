'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type UploadProgressState = {
  isUploading: boolean;
  progress: number;
  fileName: string;
  provider: 'vercel' | 'cloudinary' | null;
  activeMediaTab: string | null;
};

type UploadProgressContextType = UploadProgressState & {
  setUploadProgress: (state: Partial<UploadProgressState>) => void;
  startUpload: (fileName: string, provider: 'vercel' | 'cloudinary') => void;
  updateProgress: (progress: number) => void;
  finishUpload: () => void;
  setActiveMediaTab: (tab: string | null) => void;
};

const UploadProgressContext = createContext<UploadProgressContextType | null>(null);

export function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadProgressState>({
    isUploading: false,
    progress: 0,
    fileName: '',
    provider: null,
    activeMediaTab: null,
  });

  const setUploadProgress = useCallback((partial: Partial<UploadProgressState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const startUpload = useCallback((fileName: string, provider: 'vercel' | 'cloudinary') => {
    setState((prev) => ({ ...prev, isUploading: true, progress: 0, fileName, provider }));
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const finishUpload = useCallback(() => {
    setState((prev) => ({ ...prev, isUploading: false, progress: 0, fileName: '', provider: null }));
  }, []);

  const setActiveMediaTab = useCallback((tab: string | null) => {
    setState((prev) => ({ ...prev, activeMediaTab: tab }));
  }, []);

  return (
    <UploadProgressContext.Provider value={{ ...state, setUploadProgress, startUpload, updateProgress, finishUpload, setActiveMediaTab }}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) throw new Error('useUploadProgress must be used within UploadProgressProvider');
  return ctx;
}
