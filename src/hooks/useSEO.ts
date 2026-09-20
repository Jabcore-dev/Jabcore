import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type PageKey = 'home' | 'services' | 'products' | 'stack' | 'about' | 'contact';

interface SEOProps {
  page: PageKey;
  image?: string;
  url?: string;
  type?: string;
}

import { SITE_URL } from '@/lib/site-config'

const BASE_URL = SITE_URL

export function useSEO({
  page,
  image = `${BASE_URL}/og-image.png`,
  url = BASE_URL,
  type = 'website',
}: SEOProps) {
  const { t } = useTranslation();

  const title = 'Jabcore';
  const description = t(`seo.${page}.description`);
  const keywords = t(`seo.${page}.keywords`);

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // Update meta tags
    updateMetaTag('meta[name="description"]', description);
    updateMetaTag('meta[name="keywords"]', keywords);
    updateMetaTag('meta[name="title"]', title);

    // Open Graph
    updateMetaTag('meta[property="og:title"]', title);
    updateMetaTag('meta[property="og:description"]', description);
    updateMetaTag('meta[property="og:image"]', image);
    updateMetaTag('meta[property="og:url"]', url);
    updateMetaTag('meta[property="og:type"]', type);

    // Twitter
    updateMetaTag('meta[property="twitter:title"]', title);
    updateMetaTag('meta[property="twitter:description"]', description);
    updateMetaTag('meta[property="twitter:image"]', image);
    updateMetaTag('meta[property="twitter:url"]', url);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = url;
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = url;
      document.head.appendChild(canonical);
    }
  }, [title, description, keywords, image, url, type]);
}

export default useSEO;
