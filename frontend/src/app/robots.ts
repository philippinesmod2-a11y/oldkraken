import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/magic-login'],
      },
    ],
    sitemap: 'https://oldkraken.com/sitemap.xml',
  };
}
