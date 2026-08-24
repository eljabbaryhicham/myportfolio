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
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_1,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_1,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME_2,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_2,
  }
};

module.exports = nextConfig;
