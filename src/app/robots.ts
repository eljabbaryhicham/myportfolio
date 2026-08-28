import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/login', '/register', '/test', '/api/*'],
      },
    ],
    sitemap: 'https://mellivision.com/sitemap.xml',
    host: 'https://mellivision.com',
  };
}
