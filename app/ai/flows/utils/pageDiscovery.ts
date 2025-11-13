import * as cheerio from 'cheerio';

export type PageData = {
  url: string;
  title: string | null;
  description: string | null;
  summary: string | null;
  headings: { level: number; text: string }[];
  internalLinks: { href: string; abs: string; text: string }[];
  externalLinks: { href: string; abs: string; text: string }[];
  images: { src: string; abs: string; alt: string }[];
  sections: {
    id: string | null;
    heading: string | null;
    level: number;
    content: string | null;
  }[];
  wordCount: number;
  lastModified?: string;
};

export type DiscoveredPage = {
  url: string;
  title: string | null;
  path: string;
  slug: string;
  isCommon: boolean;
};

async function fetchHTML(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PageCrawler/1.0)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
    redirect: 'follow',
  });
  return { url: res.url || url, html: await res.text() };
}

function normalizeUrl(url: string, base: URL): string {
  try {
    const normalized = new URL(url, base);
    // Remove fragments
    normalized.hash = '';
    // Remove trailing slashes (except for root)
    if (normalized.pathname !== '/' && normalized.pathname.endsWith('/')) {
      normalized.pathname = normalized.pathname.slice(0, -1);
    }
    return normalized.toString();
  } catch {
    return url;
  }
}

function isSameDomain(url: string, base: URL): boolean {
  try {
    const u = new URL(url);
    return u.hostname === base.hostname;
  } catch {
    return false;
  }
}

function shouldCrawl(url: string, base: URL, discovered: Set<string>): boolean {
  if (!isSameDomain(url, base)) return false;
  if (discovered.has(url)) return false;
  
  // Skip common non-content URLs
  const skipPatterns = [
    /\.(pdf|doc|docx|xls|xlsx|zip|rar|tar|gz)$/i,
    /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
    /\.(css|js|json|xml)$/i,
    /mailto:/i,
    /tel:/i,
    /javascript:/i,
    /#/,
    /\/feed/i,
    /\/rss/i,
    /\/sitemap/i,
  ];
  
  return !skipPatterns.some(pattern => pattern.test(url));
}

const COMMON_PAGE_KEYWORDS = [
  'home',
  'index',
  'about',
  'services',
  'service',
  'contact',
  'apply',
  'career',
  'job',
  'jobs',
  'project',
  'projects',
  'portfolio',
  'case',
  'cases',
  'blog',
  'news',
  'study',
  'studies',
  'course',
  'courses',
  'pricing',
  'plans',
  'support',
  'help',
  'faq',
  'team',
  'login',
  'sign-in',
  'sign-in',
  'signin',
];

function getPathFromUrl(url: string) {
  try {
    const { pathname } = new URL(url);
    return pathname || '/';
  } catch {
    return '/';
  }
}

function getSlugFromPath(path: string) {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return 'home';
  return segments[segments.length - 1] || 'home';
}

function isCommonPageCandidate(slug: string, title?: string | null) {
  const lowerSlug = slug.toLowerCase();
  if (COMMON_PAGE_KEYWORDS.some((keyword) => lowerSlug.includes(keyword))) {
    return true;
  }

  if (title) {
    const lowerTitle = title.toLowerCase();
    if (COMMON_PAGE_KEYWORDS.some((keyword) => lowerTitle.includes(keyword))) {
      return true;
    }
  }

  return false;
}

export async function discoverPages(
  startUrl: string,
  maxPages: number = 20
): Promise<DiscoveredPage[]> {
  const base = new URL(startUrl);
  const discovered = new Set<string>();
  const queue: string[] = [normalizeUrl(startUrl, base)];
  const pages: DiscoveredPage[] = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift()!;

    if (discovered.has(currentUrl)) continue;
    discovered.add(currentUrl);

    try {
      const { url, html } = await fetchHTML(currentUrl);
      const normalized = normalizeUrl(url, base);
      const $ = cheerio.load(html);

      const title =
        $('title').first().text().replace(/\s+/g, ' ').trim() || null;
      const path = getPathFromUrl(normalized);
      const slug = getSlugFromPath(path);

      if (!pages.find((page) => page.url === normalized)) {
        pages.push({
          url: normalized,
          title,
          path,
          slug,
          isCommon: isCommonPageCandidate(slug, title),
        });
      }

      const links: string[] = [];

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        const absolute = normalizeUrl(href, new URL(url));
        if (shouldCrawl(absolute, base, discovered)) {
          links.push(absolute);
        }
      });

      for (const link of links) {
        if (!discovered.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${currentUrl}:`, error);
    }
  }

  return pages;
}

export async function fetchPageData(url: string): Promise<PageData> {
  try {
    const { url: finalUrl, html } = await fetchHTML(url);
    const $ = cheerio.load(html);
    const base = new URL(finalUrl);

    // Remove scripts, styles, etc.
    $('script, style, noscript, svg, canvas, iframe').remove();
    $('header, nav, aside, [role="navigation"]').remove();

    const title = $('title').first().text().trim() || null;
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      null;

    const root = $('main').first().length ? $('main').first() : $('body');
    const bodyText = root.text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    
    const summary = bodyText.slice(0, 500).trim() || null;

    // Extract headings
    const headings: { level: number; text: string }[] = [];
    root.find('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tag = (el.tagName || 'h2').toLowerCase();
      const level = Number(tag.replace('h', '')) || 2;
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) {
        headings.push({ level, text });
      }
    });

    // Extract links
    const internalLinks: { href: string; abs: string; text: string }[] = [];
    const externalLinks: { href: string; abs: string; text: string }[] = [];
    
    root.find('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return;
      }
      
      try {
        const abs = new URL(href, base).toString();
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const linkData = { href, abs, text };
        
        if (isSameDomain(abs, base)) {
          internalLinks.push(linkData);
        } else {
          externalLinks.push(linkData);
        }
      } catch {
        // Skip invalid URLs
      }
    });

    // Extract images
    const images: { src: string; abs: string; alt: string }[] = [];
    root.find('img[src]').each((_, el) => {
      const src = $(el).attr('src') || '';
      try {
        const abs = new URL(src, base).toString();
        const alt = $(el).attr('alt') || '';
        images.push({ src, abs, alt });
      } catch {
        // Skip invalid URLs
      }
    });

    // Extract sections
    const sections: {
      id: string | null;
      heading: string | null;
      level: number;
      content: string | null;
    }[] = [];

    const sectionHeadings = root.find('h1, h2, h3, h4, h5, h6').toArray();
    
    if (sectionHeadings.length === 0) {
      sections.push({
        id: null,
        heading: null,
        level: 0,
        content: bodyText.slice(0, 1000) || null,
      });
    } else {
      for (let i = 0; i < sectionHeadings.length; i++) {
        const h = sectionHeadings[i];
        const $h = $(h);
        const tag = (h.tagName || 'h2').toLowerCase();
        const level = Number(tag.replace('h', '')) || 2;
        const heading = $h.text().replace(/\s+/g, ' ').trim() || null;
        const id = $h.attr('id') || null;

        // Get content until next heading
        let content = '';
        let node = $h.next();
        while (node && node.length) {
          const tagName = (node[0]?.tagName || '').toLowerCase();
          if (/^h[1-6]$/.test(tagName)) {
            const nextLevel = Number(tagName.replace('h', '')) || 6;
            if (nextLevel <= level) break;
          }
          content += node.text() + ' ';
          node = node.next();
        }
        
        sections.push({
          id,
          heading,
          level,
          content: content.replace(/\s+/g, ' ').trim().slice(0, 500) || null,
        });
      }
    }

    return {
      url: finalUrl,
      title,
      description,
      summary,
      headings,
      internalLinks: Array.from(new Map(internalLinks.map(l => [l.abs, l])).values()),
      externalLinks: Array.from(new Map(externalLinks.map(l => [l.abs, l])).values()),
      images: Array.from(new Map(images.map(img => [img.abs, img])).values()),
      sections,
      wordCount,
    };
  } catch (error) {
    console.error(`Error fetching page data for ${url}:`, error);
    throw error;
  }
}

export async function fetchAllPagesData(
  urls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<PageData[]> {
  const results: PageData[] = [];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const data = await fetchPageData(urls[i]);
      results.push(data);
      if (onProgress) {
        onProgress(i + 1, urls.length);
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${urls[i]}:`, error);
    }
  }
  
  return results;
}

