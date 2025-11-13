"use server";

import {
  discoverPages,
  fetchAllPagesData,
  type PageData,
  type DiscoveredPage,
} from "./utils/pageDiscovery";

export type PageWiseAnalysisInput = {
  url: string;
  maxPages?: number;
  selectedUrls?: string[];
};

export type PageWiseAnalysisOutput = {
  baseUrl: string;
  totalPages: number;
  pages: PageData[];
  summary: {
    totalWordCount: number;
    totalImages: number;
    totalInternalLinks: number;
    totalExternalLinks: number;
    totalHeadings: number;
    averageWordCount: number;
  };
};

export async function analyzePageWise(
  input: PageWiseAnalysisInput
): Promise<PageWiseAnalysisOutput> {
  const maxPages = input.maxPages || 20;

  let targetUrls =
    input.selectedUrls?.filter((url) => typeof url === "string" && url.trim().length > 0) ?? [];

  if (targetUrls.length === 0) {
    const discoveredPages: DiscoveredPage[] = await discoverPages(input.url, maxPages);
    targetUrls = discoveredPages.map((page) => page.url);
  }

  const uniqueUrls = Array.from(new Set(targetUrls));

  const pagesData = await fetchAllPagesData(uniqueUrls);
  
  // Calculate summary
  const totalWordCount = pagesData.reduce((sum, page) => sum + page.wordCount, 0);
  const totalImages = pagesData.reduce((sum, page) => sum + page.images.length, 0);
  const totalInternalLinks = pagesData.reduce((sum, page) => sum + page.internalLinks.length, 0);
  const totalExternalLinks = pagesData.reduce((sum, page) => sum + page.externalLinks.length, 0);
  const totalHeadings = pagesData.reduce((sum, page) => sum + page.headings.length, 0);
  const averageWordCount = pagesData.length > 0 ? Math.round(totalWordCount / pagesData.length) : 0;
  
  return {
    baseUrl: input.url,
    totalPages: pagesData.length,
    pages: pagesData,
    summary: {
      totalWordCount,
      totalImages,
      totalInternalLinks,
      totalExternalLinks,
      totalHeadings,
      averageWordCount,
    },
  };
}

