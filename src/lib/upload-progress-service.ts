'use client';
import { logger } from '@/lib/logger';

interface UploadProgressSnapshot {
  stage: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  fileName: string;
  bytesUploaded: number;
  totalBytes: number;
  provider: 'vercel' | 'cloudinary';
  timestamp: number;
  fileHash?: string;
  retryCount: number;
}

interface UploadSession {
  sessionId: string;
  files: Map<string, UploadProgressSnapshot>;
  createdAt: number;
  updatedAt: number;
}

const SESSION_STORAGE_KEY = 'mv_upload_session';
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

function generateSessionId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getFileHash(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

export function saveUploadProgress(
  file: File,
  stage: UploadProgressSnapshot['stage'],
  progress: number,
  bytesUploaded: number,
  totalBytes: number,
  provider: 'vercel' | 'cloudinary',
  retryCount: number = 0
): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionId = getCurrentSessionId();
    const session = loadSession() || createNewSession(sessionId);
    const fileHash = getFileHash(file);

    session.files.set(fileHash, {
      stage,
      progress,
      fileName: file.name,
      bytesUploaded,
      totalBytes,
      provider,
      timestamp: Date.now(),
      fileHash,
      retryCount,
    });
    session.updatedAt = Date.now();

    saveSession(session);
  } catch (e) {
    logger.warn('Failed to save upload progress:', e);
  }
}

export function loadUploadProgress(
  file: File,
  provider: 'vercel' | 'cloudinary'
): UploadProgressSnapshot | null {
  if (typeof window === 'undefined') return null;

  try {
    const session = loadSession();
    if (!session) return null;

    const fileHash = getFileHash(file);
    const snapshot = session.files.get(fileHash);

    if (!snapshot) return null;
    if (snapshot.provider !== provider) return null;
    if (Date.now() - session.updatedAt > MAX_SESSION_AGE_MS) return null;

    return snapshot;
  } catch (e) {
    logger.warn('Failed to load upload progress:', e);
    return null;
  }
}

export function getAllUploadProgress(provider?: 'vercel' | 'cloudinary'): UploadProgressSnapshot[] {
  if (typeof window === 'undefined') return [];

  try {
    const session = loadSession();
    if (!session) return [];

    if (Date.now() - session.updatedAt > MAX_SESSION_AGE_MS) {
      clearSession();
      return [];
    }

    const snapshots = Array.from(session.files.values());
    return provider ? snapshots.filter((s) => s.provider === provider) : snapshots;
  } catch (e) {
    logger.warn('Failed to load all upload progress:', e);
    return [];
  }
}

export function clearUploadProgress(file?: File): void {
  if (typeof window === 'undefined') return;

  try {
    if (!file) {
      clearSession();
      return;
    }

    const session = loadSession();
    if (!session) return;

    const fileHash = getFileHash(file);
    session.files.delete(fileHash);
    session.updatedAt = Date.now();

    if (session.files.size === 0) {
      clearSession();
    } else {
      saveSession(session);
    }
  } catch (e) {
    logger.warn('Failed to clear upload progress:', e);
  }
}

function getCurrentSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      if (session.sessionId && Date.now() - session.updatedAt < MAX_SESSION_AGE_MS) {
        return session.sessionId;
      }
    }
  } catch {}

  const newId = generateSessionId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessionId: newId, files: {}, createdAt: Date.now(), updatedAt: Date.now() }));
  return newId;
}

function loadSession(): UploadSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed.sessionId || !parsed.files) return null;

    if (Date.now() - parsed.updatedAt > MAX_SESSION_AGE_MS) {
      clearSession();
      return null;
    }

    return {
      sessionId: parsed.sessionId,
      files: new Map(Object.entries(parsed.files)),
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  } catch (e) {
    logger.warn('Failed to parse upload session:', e);
    return null;
  }
}

function createNewSession(sessionId: string): UploadSession {
  return {
    sessionId,
    files: new Map(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function saveSession(session: UploadSession): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = {
      sessionId: session.sessionId,
      files: Object.fromEntries(session.files),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serialized));
  } catch (e) {
    logger.warn('Failed to save upload session:', e);
  }
}

function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    logger.warn('Failed to clear upload session:', e);
  }
}

export function hasInterruptedUploads(provider?: 'vercel' | 'cloudinary'): boolean {
  const snapshots = getAllUploadProgress(provider);
  return snapshots.some((s) => s.stage === 'uploading' || s.stage === 'pending');
}

export function getInterruptedUploads(provider?: 'vercel' | 'cloudinary'): UploadProgressSnapshot[] {
  return getAllUploadProgress(provider).filter(
    (s) => s.stage === 'uploading' || s.stage === 'pending'
  );
}

export function markUploadCompleted(file: File, provider: 'vercel' | 'cloudinary'): void {
  clearUploadProgress(file);
}

export function markUploadFailed(
  file: File,
  provider: 'vercel' | 'cloudinary',
  retryCount: number
): void {
  if (typeof window === 'undefined') return;

  try {
    const session = loadSession();
    if (!session) return;

    const fileHash = getFileHash(file);
    const snapshot = session.files.get(fileHash);
    if (snapshot) {
      snapshot.stage = 'failed';
      snapshot.retryCount = retryCount;
      snapshot.timestamp = Date.now();
      session.updatedAt = Date.now();
      saveSession(session);
    }
  } catch (e) {
    logger.warn('Failed to mark upload as failed:', e);
  }
}