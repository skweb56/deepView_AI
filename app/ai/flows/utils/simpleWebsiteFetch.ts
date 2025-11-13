import * as cheerio from 'cheerio';

type BasicPageInfo = {
  title: string | null;
  description: string | null;
  summary: string | null;
  contacts: {
    emails: string[];
    phones: string[];
    possibleAddresses: string[];
  };
  services: string[];
};

const clean = (s = '') => s.replace(/\s+/g, ' ').trim();
const uniq = (arr: string[]) =>	
  Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));

async function fetchHTML(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SimpleSiteFetcher/1.4)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-IN,en;q=0.9',
    },
    cache: 'no-store',
    redirect: 'follow',
  });
  return { url: res.url || url, html: await res.text() };
}

function stripChrome($: cheerio.CheerioAPI) {
  $('script, style, noscript, svg, canvas, iframe').remove();
  $('header, nav, aside, [role="navigation"], [aria-label*="nav"]').remove();
}

function bestContentRoot($: cheerio.CheerioAPI) {
  const $main = $('main').first();
  if ($main.length) return $main;
  const $article = $('article').first();
  if ($article.length) return $article;
  return $('body');
}

function summarize(text: string, maxChars = 500) {
  const sentences = text.split(/(?<=[.!?])\s+/).map(clean).filter(Boolean);
  const chosen: string[] = [];
  let len = 0;
  for (const s of sentences) {
    if (len + s.length > maxChars && chosen.length) break;
    chosen.push(s);
    len += s.length;
    if (chosen.length >= 3) break;
  }
  return chosen.length
    ? chosen.join(' ')
    : clean(text.slice(0, maxChars)) || null;
}

function normalizePhone(p: string) {
  return p.replace(/[^\d+]/g, '');
}

const PHONE_IN_PATTERN =
  /(?:\+?\s?91[\s\-()]*)?(?:0[\s\-()]*)?[6-9](?:[\s\-()]*\d){9}\b/g;

function extractEmailsFromText(text: string) {
  const classic = Array.from(
    text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
  ).map((m) => m[0]);
  const deobf = Array.from(
    text.matchAll(
      /\b([A-Z0-9._%+-]+)\s*(?:\[\s*at\s*\]|\(at\)|\s+at\s+|@)\s*([A-Z0-9.-]+)\s*(?:\[\s*dot\s*\]|\(dot\)|\s+dot\s+|\.)([A-Z]{2,})\b/gi,
    ),
  ).map((m) => `${m[1]}@${m[2]}.${m[3]}`);
  return uniq([...classic, ...deobf]);
}

function parseContactsRAW($raw: cheerio.CheerioAPI) {
  const bodyTextRaw = clean($raw('body').text() || '');
  const emails = uniq([
    ...Array.from(
      $raw('a[href^="mailto:"]').map(
        (_, a) => ($raw(a).attr('href') || '').replace(/^mailto:/i, ''),
      ),
    ),
    ...extractEmailsFromText(bodyTextRaw),
  ]);

  const phones = uniq([
    ...Array.from(
      $raw('a[href^="tel:"]').map(
        (_, a) => ($raw(a).attr('href') || '').replace(/^tel:/i, ''),
      ),
    ).map(normalizePhone),
    ...Array.from(bodyTextRaw.matchAll(PHONE_IN_PATTERN)).map((m) =>
      normalizePhone(m[0]),
    ),
  ]);

  const lines = bodyTextRaw.split(/\r?\n/).map(clean).filter(Boolean);
  const streetToken =
    /(Street|St\.|Road|Rd\.|Avenue|Ave\.|Lane|Ln\.|Drive|Dr\.|Court|Ct\.|Boulevard|Blvd\.|Place|Pl\.|Apartment|Apt\.|Suite|Unit|Floor|Block|Sector|Near|Opposite|Area|Nagar)/i;
  const hasNumber = /\b\d{1,5}\b/;
  const postalIN = /\b\d{6}\b/;
  const locality =
    /(India|IN|Mumbai|Delhi|New Delhi|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Pune|Noida|Gurgaon|Ahmedabad|Surat|Indore|Jaipur|Lucknow)/i;

  const addressCandidates = lines.filter(
    (l) =>
      ((hasNumber.test(l) && streetToken.test(l)) ||
        postalIN.test(l) ||
        locality.test(l)),
  );

  const addresses = uniq(addressCandidates).slice(0, 5);

  return { emails, phones, addresses };
}

function parseServicesFromDoc($: cheerio.CheerioAPI) {
  const items: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const data = JSON.parse(raw);
      const walk = (node: any) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === 'object') {
          const t = String(node['@type'] || node.type || '').toLowerCase();
          if (t.includes('service') && node.name) items.push(clean(String(node.name)));
          Object.values(node).forEach(walk);
        }
      };
      walk(data);
    } catch {
      /* ignore */
    }
  });

  const candidateSections = $('[id*="service"],[class*="service"],section').filter(
    (_, el) => {
      const heading = $(el).find('h2,h3').first().text() || '';
      return /services?/i.test(heading) || $(el).is('[id*="service"],[class*="service"]');
    },
  );

  candidateSections
    .find('li, .card h2, .card h3, .card h4, h3, h4, h5')
    .each((_, el) => {
      const t = clean($(el).text());
      if (t && t.length <= 120 && /[A-Za-z]/.test(t)) items.push(t);
    });

  $('h2,h3').each((_, h) => {
    const t = clean($(h).text());
    if (/services?/i.test(t)) {
      $(h)
        .nextUntil('h1,h2,h3')
        .find('li, h4, h5, .card h3, .card h4')
        .each((__, el) => {
          const txt = clean($(el).text());
          if (txt && txt.length <= 120) items.push(txt);
        });
    }
  });

  const blacklist =
    /^(home|about|contact|services|apply now|track order|read more|learn more|get quote|get a quote|view more)$/i;
  return uniq(
    items
      .map((s) => s.replace(/[•·►▶–—\-|]+/g, '').trim())
      .filter((s) => !blacklist.test(s)),
  ).slice(0, 30);
}

/* -------------------------- NEW TYPES (section-wise) -------------------------- */

type LinkInfo = {
  href: string; // original attribute
  abs: string; // absolute url
  text: string; // anchor text
  rel: 'internal' | 'external';
};

type ImageInfo = {
  src: string;
  abs: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

type SectionBlock = {
  id: string | null;
  heading: string | null;
  level: number; // 1..6 (or 0 for root-without-heading)
  content: string | null;
  links: LinkInfo[];
  images: ImageInfo[];
};

type SectionWiseData = {
  overview: string | null;
  headings: { level: number; text: string }[];
  internalLinks: LinkInfo[];
  externalLinks: LinkInfo[];
  images: ImageInfo[];
  sections: SectionBlock[];
};

/* -------------------------- NEW HELPERS (non-breaking) -------------------------- */

const isHttpLike = (u: URL) => ['http:', 'https:'].includes(u.protocol);

function classifyLink(abs: string, base: URL): 'internal' | 'external' {
  try {
    const u = new URL(abs);
    return u.host === base.host ? 'internal' : 'external';
  } catch {
    return 'internal';
  }
}

function toAbs(href: string, base: URL) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function collectLinks(
  $: cheerio.CheerioAPI,
  scope: cheerio.Cheerio<any>,
  base: URL,
): LinkInfo[] {
  const items: LinkInfo[] = [];
  scope.find('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (
      !href ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    )
      return;

    const abs = toAbs(href, base);
    try {
      const u = new URL(abs);
      if (!isHttpLike(u)) return;
    } catch {
      return;
    }
    const text = ($(el).text() || '').replace(/\s+/g, ' ').trim();
    items.push({ href, abs, text, rel: classifyLink(abs, base) });
  });
  const key = (x: LinkInfo) => `${x.abs}::${x.text}`;
  const map = new Map(items.map((x) => [key(x), x]));
  return Array.from(map.values());
}

function collectImages(
  $: cheerio.CheerioAPI,
  scope: cheerio.Cheerio<any>,
  base: URL,
): ImageInfo[] {
  const imgs: ImageInfo[] = [];
  scope.find('img[src]').each((_, el) => {
    const src = ($(el).attr('src') || '').trim();
    if (!src) return;
    const abs = toAbs(src, base);
    const alt = ($(el).attr('alt') || '').replace(/\s+/g, ' ').trim();
    const width = Number($(el).attr('width')) || null;
    const height = Number($(el).attr('height')) || null;
    imgs.push({ src, abs, alt, width, height });
  });
  const map = new Map(imgs.map((x) => [x.abs, x]));
  return Array.from(map.values());
}

function buildSections(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<any>,
  base: URL,
): SectionBlock[] {
  const headings = root.find('h1, h2, h3, h4, h5, h6').toArray();

  if (!headings.length) {
    const links = collectLinks($, root, base);
    const images = collectImages($, root, base);
    const content =
      root.clone().find('a, img').remove().end().text().replace(/\s+/g, ' ').trim() ||
      null;
    return [
      {
        id: null,
        heading: null,
        level: 0,
        content,
        links,
        images,
      },
    ];
  }

  const sections: SectionBlock[] = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i] as any;
    const $h = $(h);
    const tag = (h.tagName || 'h2').toLowerCase();
    const level = Number(tag.replace('h', '')) || 2;
    const heading = $h.text().replace(/\s+/g, ' ').trim() || null;
    const id = $h.attr('id') || null;

    const chunk: cheerio.Cheerio<any>[] = [];
    let node = $h.next();
    while (node && node.length) {
      const tagName = (node[0].tagName || '').toLowerCase();
      if (/^h[1-6]$/.test(tagName)) {
        const nextLevel = Number(tagName.replace('h', '')) || 6;
        if (nextLevel <= level) break;
      }
      chunk.push(node);
      node = node.next();
    }

    // create a temporary scope wrapper
    const $$ = cheerio.load('<div/>');
    const $scope = $$('div');
    chunk.forEach((n) => $scope.append($(n).clone()));

    const links = collectLinks($, $scope, base);
    const images = collectImages($, $scope, base);
    const content = $scope.text().replace(/\s+/g, ' ').trim() || null;

    sections.push({ id, heading, level, content, links, images });
  }
  return sections;
}

/* -------------------------- YOUR ORIGINAL FUNCTION (UNCHANGED) -------------------------- */

export async function simpleWebsiteFetch(url: string): Promise<BasicPageInfo> {
  const main = await fetchHTML(url);
  const $raw = cheerio.load(main.html);
  const $ = cheerio.load(main.html);
  stripChrome($);

  const base = new URL(main.url || url);

  const title =
    clean($('title').first().text()) ||
    clean($raw('title').first().text()) ||
    null;
  const description =
    $raw('meta[name="description"]').attr('content') ||
    $raw('meta[property="og:description"]').attr('content') ||
    null;

  const root = bestContentRoot($);
  const bodyText = clean(root.text() || '');
  const summary = summarize(bodyText);

  let { emails, phones, addresses } = parseContactsRAW($raw);
  let services = parseServicesFromDoc($);

  $raw('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($raw(el).contents().text());
      const walk = (node: any) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === 'object') {
          if (
            (node['@type'] === 'Organization' || node['@type'] === 'LocalBusiness') &&
            node.contactPoint
          ) {
            const cps = Array.isArray(node.contactPoint)
              ? node.contactPoint
              : [node.contactPoint];
            for (const cp of cps) {
              if (cp?.email) emails.push(String(cp.email));
              if (cp?.telephone) phones.push(normalizePhone(String(cp.telephone)));
            }
          }
          Object.values(node).forEach(walk);
        }
      };
      walk(data);
    } catch {
      /* ignore */
    }
  });

  const anchors = Array.from($raw('a[href]')).map((a) => {
    const href = $raw(a).attr('href') || '';
    const abs = new URL(href, base).toString();
    const text = clean($raw(a).text());
    return { href, abs, text };
  });

  const findFirst = (
    ...preds: ((a: { href: string; abs: string; text: string }) => boolean)[]
  ) => anchors.find((a) => preds.some((p) => p(a)));

  const isContact = (a: any) =>
    /contact/i.test(a.href) ||
    /contact/i.test(a.text) ||
    /\/contact[-/]?us/i.test(a.href);
  const isService = (a: any) =>
    /services?/i.test(a.href) || /services?/i.test(a.text);

  const contactLink = findFirst(isContact);
  const serviceLink = findFirst(isService);

  if (serviceLink) {
    try {
      const svc = await fetchHTML(serviceLink.abs);
      const $$ = cheerio.load(svc.html);
      stripChrome($$);
      services = uniq([...services, ...parseServicesFromDoc($$)]);
    } catch {
      /* ignore */
    }
  }

  if (contactLink) {
    try {
      const c = await fetchHTML(contactLink.abs);
      const $$raw = cheerio.load(c.html);
      const cData = parseContactsRAW($$raw);
      emails = uniq([...emails, ...cData.emails]);
      phones = uniq([...phones, ...cData.phones]);
      addresses = uniq([...addresses, ...cData.addresses]);
    } catch {
      /* ignore */
    }
  }

  return {
    title,
    description: description ? clean(description) : null,
    summary,
    contacts: {
      emails: uniq(emails),
      phones: uniq(phones),
      possibleAddresses: uniq(addresses),
    },
    services: uniq(services),
  };
}

/* -------------------------- NEW PUBLIC API -------------------------- */

export async function fetchSectionWiseData(url: string): Promise<SectionWiseData> {
  const main = await fetchHTML(url);
  const base = new URL(main.url || url);

  const $raw = cheerio.load(main.html);
  const $ = cheerio.load(main.html);
  stripChrome($);

  const root = bestContentRoot($);

  const overview = summarize(root.text() || '', 600);

  const headings = root
    .find('h1,h2,h3,h4,h5,h6')
    .toArray()
    .map((h: any) => {
      const t = ($(h).text() || '').replace(/\s+/g, ' ').trim();
      const lvl = Number((h.tagName || 'h2').toLowerCase().replace('h', '')) || 2;
      return { level: lvl, text: t };
    });

  const allLinks = collectLinks($, root, base);
  const internalLinks = allLinks.filter((l) => l.rel === 'internal');
  const externalLinks = allLinks.filter((l) => l.rel === 'external');
  const images = collectImages($, root, base);

  const sections = buildSections($, root, base);

  return { overview, headings, internalLinks, externalLinks, images, sections };
}

export async function fetchWebsiteFull(url: string) {
  const basic = await simpleWebsiteFetch(url);
  const extra = await fetchSectionWiseData(url);
  return { basic, extra };
}

/* -------------------------- EXPORT EXTRA TYPES -------------------------- */
export type {
  BasicPageInfo,
  LinkInfo,
  ImageInfo,
  SectionBlock,
  SectionWiseData,
};
