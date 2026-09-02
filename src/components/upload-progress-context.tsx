'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';

export type MediaProviderKey = 'vercel' | 'cloudinary' | 'appwrite' | 'gumlet_video' | 'gumlet_image';
export const MEDIA_PROVIDER_KEYS: MediaProviderKey[] = ['vercel', 'cloudinary', 'appwrite', 'gumlet_video', 'gumlet_image'];

export type MediaLibraryId = 'primary' | 'extented' | 'vercel_blob' | 'appwrite' | 'gumlet_video' | 'gumlet_image';
export type MediaResourceType = 'image' | 'video' | 'raw';

export type ProviderState = { isUploading: boolean; progress: number; fileName: string };

type ProviderStates = Record<MediaProviderKey, ProviderState>;

// Back-compat single-upload view (for consumers that expect the old shape).
// `provider` here is only ever 'vercel' | 'cloudinary' | 'appwrite' | 'gumlet_video' | 'gumlet_image'.
type UploadProgressState = ProviderStates & {
  activeMediaTab: string | null;
  isUploading: boolean;
  progress: number;
  fileName: string;
  provider: MediaProviderKey | null;
};

type CompletedUpload = {
  docId: string;
  resourceType: MediaResourceType;
  libraryId: MediaLibraryId;
  provider: MediaProviderKey;
  fileName?: string;
  source?: 'media-library' | 'media-picker';
} | null;

const COMPLETED_UPLOAD_KEY = 'mv_completed_upload';

type UploadProgressContextType = UploadProgressState & {
  setUploadProgress: (state: Partial<UploadProgressState>) => void;
  startUpload: (fileName: string, provider: MediaProviderKey) => void;
  updateProgress: (progress: number, provider?: MediaProviderKey) => void;
  finishUpload: (provider?: MediaProviderKey) => void;
  clearFileName: (provider: MediaProviderKey) => void;
  setActiveMediaTab: (tab: string | null) => void;
  completedUpload: CompletedUpload;
  signalCompletedUpload: (docId: string, resourceType: MediaResourceType, libraryId: MediaLibraryId, provider: MediaProviderKey, fileName?: string, source?: 'media-library' | 'media-picker') => void;
  consumeCompletedUpload: () => void;
};

const EMPTY_PROVIDER: ProviderState = { isUploading: false, progress: 0, fileName: '' };

const UploadProgressContext = createContext<UploadProgressContextType | null>(null);

export function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadProgressState>(() => {
    const slots = {} as ProviderStates;
    for (const key of MEDIA_PROVIDER_KEYS) slots[key] = { ...EMPTY_PROVIDER };
    return {
      ...slots,
      activeMediaTab: null,
      isUploading: false,
      progress: 0,
      fileName: '',
      provider: null,
    };
  });

  const [completedUpload, setCompletedUpload] = useState<CompletedUpload>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(COMPLETED_UPLOAD_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Throttle progress updates so a fast onUploadProgress callback (fires on
  // every network chunk) doesn't re-render the whole app shell dozens of times
  // per second — that's what made page navigation feel laggy during an upload.
  const lastProgressUpdate = useRef(0);
  const pendingProgress = useRef<{ progress: number; provider?: MediaProviderKey } | null>(null);
  const trailingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyProgress = useCallback((progress: number, provider?: MediaProviderKey) => {
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

  const updateProgress = useCallback((progress: number, provider?: MediaProviderKey) => {
    const now = Date.now();
    const THROTTLE_MS = 250;
    pendingProgress.current = { progress, provider };
    if (now - lastProgressUpdate.current >= THROTTLE_MS) {
      lastProgressUpdate.current = now;
      const { progress: p, provider: prov } = pendingProgress.current;
      pendingProgress.current = null;
      applyProgress(p, prov);
    }
    // Ensure the trailing value (e.g. reaching 100%) is always applied even if
    // the throttle window hadn't elapsed when it was set.
    if (trailingTimer.current) clearTimeout(trailingTimer.current);
    trailingTimer.current = setTimeout(() => {
      if (pendingProgress.current) {
        const { progress: p, provider: prov } = pendingProgress.current;
        pendingProgress.current = null;
        applyProgress(p, prov);
      }
    }, THROTTLE_MS);
  }, [applyProgress]);

  useEffect(() => () => { if (trailingTimer.current) clearTimeout(trailingTimer.current); }, []);

  const setUploadProgress = useCallback((partial: Partial<UploadProgressState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const startUpload = useCallback((fileName: string, provider: MediaProviderKey) => {
    // Clear any stale "completed" upload from a previous run so a failed upload
    // can never reuse an old success state (which caused a false "Uploaded" card).
    setCompletedUpload(null);
    try { localStorage.removeItem(COMPLETED_UPLOAD_KEY); } catch {}
    setState((prev) => ({
      ...prev,
      [provider]: { isUploading: true, progress: 0, fileName },
      isUploading: true,
      progress: 0,
      fileName,
      provider,
    }));
  }, []);

  const finishUpload = useCallback((provider?: MediaProviderKey) => {
    setState((prev) => {
      const target = provider || prev.provider;
      if (!target) return { ...prev, isUploading: false, progress: 0, provider: null };
      const next = {
        ...prev,
        [target]: { ...prev[target], isUploading: false, progress: 0 },
      };
      if (prev.provider === target) {
        next.isUploading = MEDIA_PROVIDER_KEYS.some((k) => next[k].isUploading);
        if (!next.isUploading) {
          next.progress = 0;
          next.provider = null;
          // Keep fileName — the notification effect needs it to detect completion
        } else {
          const active = MEDIA_PROVIDER_KEYS.find((k) => next[k].isUploading);
          if (active) {
            next.progress = next[active].progress;
            next.fileName = next[active].fileName;
            next.provider = active;
          }
        }
      }
      return next;
    });
  }, []);

  const setActiveMediaTab = useCallback((tab: string | null) => {
    setState((prev) => ({ ...prev, activeMediaTab: tab }));
  }, []);

  const clearFileName = useCallback((provider: MediaProviderKey) => {
    setState((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], fileName: '' },
      ...(prev.provider === provider ? { fileName: '' } : {}),
    }));
  }, []);

  const signalCompletedUpload = useCallback((docId: string, resourceType: MediaResourceType, libraryId: MediaLibraryId, provider: MediaProviderKey, fileName?: string, source?: 'media-library' | 'media-picker') => {
    const data = { docId, resourceType, libraryId, provider, fileName, source };
    setCompletedUpload(data);
    try { localStorage.setItem(COMPLETED_UPLOAD_KEY, JSON.stringify(data)); } catch {}
  }, []);

  const consumeCompletedUpload = useCallback(() => {
    setCompletedUpload(null);
    try { localStorage.removeItem(COMPLETED_UPLOAD_KEY); } catch {}
  }, []);

  const value = useMemo(() => ({
    ...state,
    setUploadProgress,
    startUpload,
    updateProgress,
    finishUpload,
    clearFileName,
    setActiveMediaTab,
    completedUpload,
    signalCompletedUpload,
    consumeCompletedUpload,
  }), [state, setUploadProgress, startUpload, updateProgress, finishUpload, clearFileName, setActiveMediaTab, completedUpload, signalCompletedUpload, consumeCompletedUpload]);

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const ctx = useContext(UploadProgressContext);
  if (!ctx) throw new Error('useUploadProgress must be used within UploadProgressProvider');
  return ctx;
}