/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
       {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'files.catbox.moe',
      },
      {
        protocol: 'https',
        hostname: 'portfolio-hicham-ten.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
    ],
  },
  // NOTE: Vercel will warn if routes set their own Cache-Control, because it
  // overrides Vercel's managed caching for static/ISR content. We intentionally
  // do NOT set Cache-Control here:
  //   - /_next/static already gets immutable caching by default.
  //   - All API routes are POST (mutating) and Vercel never caches POST.
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2,
  }
};

module.exports = nextConfig;
