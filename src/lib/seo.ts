import { useEffect } from 'react';
import { siteConfig } from '../config';

/**
 * SEO utilities for managing page metadata in SPA
 * These helpers automatically update document title and meta tags
 * using the centralized site configuration.
 */

export function usePageMetadata(title?: string, description?: string) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | ${siteConfig.name}`;
    } else {
      document.title = `${siteConfig.name} - ${siteConfig.tagline}`;
    }

    // Update or create meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    const desc = description || siteConfig.description;
    
    if (metaDescription) {
      metaDescription.setAttribute('content', desc);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }

    // Update OG meta tags
    updateMetaTag('property', 'og:title', title || `${siteConfig.name} - ${siteConfig.tagline}`);
    updateMetaTag('property', 'og:description', description || siteConfig.description);
    updateMetaTag('property', 'og:image', siteConfig.ogImage);
    updateMetaTag('property', 'og:url', import.meta.env.VITE_SITE_URL || "");
    
    // Update Twitter meta tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    if (siteConfig.twitterHandle) {
      updateMetaTag('name', 'twitter:site', `@${siteConfig.twitterHandle}`);
    }
    updateMetaTag('name', 'twitter:title', title || `${siteConfig.name} - ${siteConfig.tagline}`);
    updateMetaTag('name', 'twitter:description', description || siteConfig.description);
    updateMetaTag('name', 'twitter:image', siteConfig.ogImage);
  }, [title, description]);
}

function updateMetaTag(attribute: string, name: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
}

/**
 * Get structured data for SEO
 */
export function getOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.contact.company,
    url: import.meta.env.VITE_SITE_URL,
    description: siteConfig.description,
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contact.email,
      contactType: 'customer service',
    },
  };
}

/**
 * Get website structured data
 */
export function getWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    description: siteConfig.description,
    url: import.meta.env.VITE_SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${import.meta.env.VITE_SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}
