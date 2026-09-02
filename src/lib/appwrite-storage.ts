import { Client, ID, Permission, Role, Storage } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import type { Models } from 'node-appwrite';
import { getAppwriteMediaConfiguration, type AppwriteMediaConfiguration } from '@/lib/media-server-config';
import type { ProviderAssetRecord, MediaResourceType } from '@/lib/media-providers';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export { MAX_UPLOAD_BYTES };

function configuredAppwrite(): AppwriteMediaConfiguration {
  const result = getAppwriteMediaConfiguration();
  if (!result.configured) {
    throw new Error(`Appwrite media is not configured. Missing: ${result.missing.join(', ')}.`);
  }
  return result.value;
}

export function getAppwriteStorage() {
  const config = configuredAppwrite();
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  return { config, storage: new Storage(client) };
}

export function appwriteResourceType(mimeType: string): MediaResourceType {
  if (mimeType.toLowerCase().startsWith('image/')) return 'image';
  if (mimeType.toLowerCase().startsWith('video/')) return 'video';
  return 'raw';
}

/**
 * Public site assets are explicitly granted public read permission on upload.
 * This URL deliberately never includes an API key or an Appwrite file token.
 */
export function appwriteViewUrl(config: Pick<AppwriteMediaConfiguration, 'endpoint' | 'projectId' | 'bucketId'>, fileId: string) {
  const url = new URL(
    `${config.endpoint}/storage/buckets/${encodeURIComponent(config.bucketId)}/files/${encodeURIComponent(fileId)}/view`
  );
  url.searchParams.set('project', config.projectId);
  return url.toString();
}

export function toProviderAsset(config: Pick<AppwriteMediaConfiguration, 'endpoint' | 'projectId' | 'bucketId'>, file: Models.File): ProviderAssetRecord {
  return {
    provider: 'appwrite',
    providerAssetId: file.$id,
    url: appwriteViewUrl(config, file.$id),
    filename: file.name,
    resourceType: appwriteResourceType(file.mimeType),
    contentType: file.mimeType,
    size: file.sizeOriginal,
    createdAt: file.$createdAt,
  };
}

export async function uploadAppwriteFile(file: File): Promise<ProviderAssetRecord> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB Appwrite upload limit.`);
  }

  const { config, storage } = getAppwriteStorage();
  const bytes = Buffer.from(await file.arrayBuffer());
  const uploaded = await storage.createFile({
    bucketId: config.bucketId,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(bytes, safeFilename(file.name)),
    // These assets are selected for public pages. Per-file public read keeps
    // write/delete access server-only while allowing media delivery.
    permissions: [Permission.read(Role.any())],
  });

  return toProviderAsset(config, uploaded);
}

/**
 * Imports a remote file by URL into Appwrite Storage by streaming its bytes
 * server-side. This enables the same "Add from URL" flow as Cloudinary.
 */
export async function linkAppwriteFile(sourceUrl: string, filename?: string): Promise<ProviderAssetRecord> {
  const parsed = new URL(sourceUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('Appwrite link import requires an HTTPS URL.');
  }

  const response = await fetch(sourceUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`Could not fetch the remote file (${response.status}).`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const lengthHeader = response.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB Appwrite upload limit.`);
  }

  const name = filename?.trim() || parsed.pathname.split('/').pop() || 'imported-file';
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB Appwrite upload limit.`);
  }

  const { config, storage } = getAppwriteStorage();
  const uploaded = await storage.createFile({
    bucketId: config.bucketId,
    fileId: ID.unique(),
    file: InputFile.fromBuffer(buffer, safeFilename(decodeURIComponent(name))),
    permissions: [Permission.read(Role.any())],
  });

  return toProviderAsset(config, uploaded);
}

export async function listAppwriteFiles(search?: string, limit = 100): Promise<ProviderAssetRecord[]> {
  const { config, storage } = getAppwriteStorage();
  const result = await storage.listFiles({
    bucketId: config.bucketId,
    search: search?.trim() || undefined,
    total: false,
  });
  return result.files.slice(0, limit).map((file) => toProviderAsset(config, file));
}

export async function deleteAppwriteFile(fileId: string): Promise<void> {
  const { config, storage } = getAppwriteStorage();
  await storage.deleteFile({ bucketId: config.bucketId, fileId });
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 240) || 'file';
}
