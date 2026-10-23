import { defineConfig } from 'astro/config';
import { CUSTOM_DOMAIN, BASE_PATH } from './src/server-constants';
import CoverImageDownloader from './src/integrations/cover-image-downloader';
import CustomIconDownloader from './src/integrations/custom-icon-downloader';
import FeaturedImageDownloader from './src/integrations/featured-image-downloader';
import PublicNotionCopier from './src/integrations/public-notion-copier';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const isCanonicalPage = (page) => {
  const { pathname } = new URL(page);
  if (pathname.startsWith('/og/')) {
    return false;
  }
  if (pathname === '/feed' || pathname === '/feed/') {
    return false;
  }
  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return false;
  }
  return pathname === '/' || pathname.endsWith('/');
};
const getSite = function () {
  if (CUSTOM_DOMAIN) {
    return new URL(BASE_PATH, `https://${CUSTOM_DOMAIN}`).toString();
  }
  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return new URL(BASE_PATH, `https://${process.env.VERCEL_URL}`).toString();
  }
  if (process.env.CF_PAGES) {
    if (process.env.CF_PAGES_BRANCH !== 'main') {
      return new URL(BASE_PATH, process.env.CF_PAGES_URL).toString();
    }
    return new URL(
      BASE_PATH,
      `https://${new URL(process.env.CF_PAGES_URL).host.split('.').slice(1).join('.')}`
    ).toString();
  }
  return new URL(BASE_PATH, 'http://localhost:4321').toString();
};

// https://astro.build/config
export default defineConfig({
  site: getSite(),
  base: BASE_PATH,
  trailingSlash: 'always',
  vite: {
    optimizeDeps: {
      include: ['@primer/react', '@primer/react/next', '@primer/react-brand'],
    },
    ssr: { noExternal: ['@primer/react'] },
    // Brand 0.57 ships UMD: Node handles dev SSR; Rollup converts it for builds.
    plugins: [
      {
        name: 'primer-brand-build-interop',
        apply: 'build',
        config: () => ({ ssr: { noExternal: ['@primer/react-brand'] } }),
      },
    ],
  },
  integrations: [
    CoverImageDownloader(),
    CustomIconDownloader(),
    FeaturedImageDownloader(),
    PublicNotionCopier(),
    react(),
    sitemap({ filter: isCanonicalPage }),
  ],
});
