import { z } from 'zod';

type Environment = Record<string, string | undefined>;

export type ProviderConfiguration =
  | { configured: true; value: AppwriteMediaConfiguration }
  | { configured: false; missing: string[] };

export interface AppwriteMediaConfiguration {
  endpoint: string;
  projectId: string;
  bucketId: string;
  apiKey: string;
}

export interface GumletVideoConfiguration {
  apiKey: string;
  workspaceId: string;
}

export interface GumletImageConfiguration {
  sourceHost: string;
  allowedOriginHosts: string[];
}

const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === 'https:', {
  message: 'Must use HTTPS.',
});

const requiredEnvironment = (env: Environment, names: string[]) =>
  names.filter((name) => !env[name]?.trim());

/**
 * Returns only a configuration state; it never logs or returns credential
 * values when configuration is incomplete.
 */
export function getAppwriteMediaConfiguration(env: Environment = process.env): ProviderConfiguration {
  const names = [
    'APPWRITE_ENDPOINT',
    'APPWRITE_PROJECT_ID',
    'APPWRITE_MEDIA_BUCKET_ID',
    'APPWRITE_API_KEY',
  ];
  const missing = requiredEnvironment(env, names);
  if (missing.length > 0) return { configured: false, missing };

  const endpoint = httpsUrl.safeParse(env.APPWRITE_ENDPOINT);
  if (!endpoint.success) return { configured: false, missing: ['APPWRITE_ENDPOINT (valid HTTPS URL)'] };

  return {
    configured: true,
    value: {
      endpoint: endpoint.data.replace(/\/$/, ''),
      projectId: env.APPWRITE_PROJECT_ID!.trim(),
      bucketId: env.APPWRITE_MEDIA_BUCKET_ID!.trim(),
      apiKey: env.APPWRITE_API_KEY!.trim(),
    },
  };
}

export function getGumletVideoConfiguration(env: Environment = process.env):
  | { configured: true; value: GumletVideoConfiguration }
  | { configured: false; missing: string[] } {
  const names = ['GUMLET_API_KEY', 'GUMLET_VIDEO_WORKSPACE_ID'];
  const missing = requiredEnvironment(env, names);
  if (missing.length > 0) return { configured: false, missing };

  return {
    configured: true,
    value: {
      apiKey: env.GUMLET_API_KEY!.trim(),
      workspaceId: env.GUMLET_VIDEO_WORKSPACE_ID!.trim(),
    },
  };
}

export function getGumletImageConfiguration(env: Environment = process.env):
  | { configured: true; value: GumletImageConfiguration }
  | { configured: false; missing: string[] } {
  const missing = requiredEnvironment(env, ['GUMLET_IMAGE_SOURCE_HOST', 'GUMLET_IMAGE_ALLOWED_ORIGINS']);
  if (missing.length > 0) return { configured: false, missing };

  const sourceHost = env.GUMLET_IMAGE_SOURCE_HOST!.trim().toLowerCase();
  const allowedOriginHosts = env.GUMLET_IMAGE_ALLOWED_ORIGINS!
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (!/^[a-z0-9.-]+$/.test(sourceHost) || allowedOriginHosts.some((host) => !/^[a-z0-9.-]+$/.test(host))) {
    return { configured: false, missing: ['GUMLET_IMAGE_SOURCE_HOST and GUMLET_IMAGE_ALLOWED_ORIGINS (hostnames only)'] };
  }

  return { configured: true, value: { sourceHost, allowedOriginHosts } };
}
