/**
 * Shared Cloudinary library configuration.
 *
 * The site can point at up to three Cloudinary accounts, each configured
 * through its own env var group selected by library id:
 *
 *   primary   -> *_1 (legacy: also reachable through unsuffixed env vars)
 *   extented  -> *_2
 *   extented2 -> *_3
 *
 * Client-side uploads read the NEXT_PUBLIC_* (unsigned preset) vars;
 * server-side delete / URL-import flows read the CLOUDINARY_* vars.
 */

export type CloudinaryLibraryId = 'primary' | 'extented' | 'extented2';

export const CLOUDINARY_LIBRARY_IDS: CloudinaryLibraryId[] = ['primary', 'extented', 'extented2'];

export function isCloudinaryLibraryId(value: unknown): value is CloudinaryLibraryId {
  return value === 'primary' || value === 'extented' || value === 'extented2';
}

export function cloudinaryEnvSuffix(libraryId: CloudinaryLibraryId): '1' | '2' | '3' {
  return libraryId === 'primary' ? '1' : libraryId === 'extented' ? '2' : '3';
}

export function cloudinaryClientUploadEnv(libraryId: CloudinaryLibraryId): {
  cloudName?: string;
  uploadPreset?: string;
} {
  // NOTE: env vars must be read via literal property names. Next.js only
  // statically inlines `process.env.NEXT_PUBLIC_*` references into browser
  // bundles when the variable name is written out explicitly — a computed
  // key (`process.env[`..._${n}`]`) is evaluated at runtime in the browser
  // and always comes back undefined.
  switch (libraryId) {
    case 'primary':
      return {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1,
      };
    case 'extented':
      return {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2,
      };
    case 'extented2':
      return {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_3,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_3,
      };
  }
}