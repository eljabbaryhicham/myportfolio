'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';

export type MediaProviderKey = 'vercel' | 'cloudinary' | 'appwrite' | 'gumlet_video' | 'gumlet_image' | 'imagekit';
export const MEDIA_PROVIDER_KEYS: MediaProviderKey[] = ['vercel', 'cloudinary', 'appwrite', 'gumlet_video', 'gumlet_image', 'imagekit'];

export type MediaLibraryId = 'primary' | 'extented' | 'vercel_blob' | 'appwrite' | 'gumlet_video' | 'gumlet_image' | 'imagekit';
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

  // A completion is a transient UI event. Persisting it replays an old upload
  // after a reload or later navigation, which can show a false notification or
  // reopen a media library.
  const [completedUpload, setCompletedUpload] = useState<CompletedUpload>(null);

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
    // Clear a previous in-session completion before beginning a new upload.
    setCompletedUpload(null);
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
  }, []);

  const consumeCompletedUpload = useCallback(() => {
    setCompletedUpload(null);
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
