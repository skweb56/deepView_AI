"use server";

/**
 * @fileOverview AI-powered website analysis flow + robust simple fetch
 * (title, description, summary, contacts, services) with India-friendly contact parsing.
 */

import { ai } from "../../ai/genkit";
import {
  analyzeWebsitePrompt,
  AnalyzeWebsiteInputSchema,
  AnalyzeWebsiteOutputSchema,
  type AnalyzeWebsiteInput,
  type AnalyzeWebsiteOutput,
  type IssueDetail,
} from "./prompts/analyzeWebsitePrompt";
import { simpleWebsiteFetch , fetchSectionWiseData } from "./utils/simpleWebsiteFetch";

export type { AnalyzeWebsiteInput, AnalyzeWebsiteOutput, IssueDetail };

const RETRIABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const extractStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object") return undefined;
  const statusFromResponse = (error as { response?: { status?: number } }).response?.status;
  if (typeof statusFromResponse === "number") return statusFromResponse;
  const directStatus = (error as { status?: number }).status;
  if (typeof directStatus === "number") return directStatus;
  const detailsStatus = (error as { details?: { statusCode?: number } }).details?.statusCode;
  if (typeof detailsStatus === "number") return detailsStatus;
  return undefined;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function analyzeWebsitePromptWithRetry(
  input: AnalyzeWebsiteInput,
  {
    retries = 5,
    delayMs = 1_000,
    maxDelayMs = 10_000,
  }: { retries?: number; delayMs?: number; maxDelayMs?: number } = {}
) {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < retries) {
    try {
      return await analyzeWebsitePrompt(input);
    } catch (error) {
      lastError = error;
      attempt += 1;

      const status = extractStatusCode(error);
      const isRetriable = status ? RETRIABLE_STATUS_CODES.has(status) : true;

      if (!isRetriable || attempt >= retries) {
        break;
      }

      const exponentialDelay = Math.min(maxDelayMs, delayMs * 2 ** (attempt - 1));
      const jitter = Math.random() * 250;
      const waitTime = exponentialDelay + jitter;

      console.warn(
        `analyzeWebsitePrompt attempt ${attempt} failed${status ? ` (status ${status})` : ""}. Retrying in ${Math.round(waitTime)}ms...`
      );
      await wait(waitTime);
    }
  }

  const status = extractStatusCode(lastError);
  const friendlyMessage =
    status && RETRIABLE_STATUS_CODES.has(status)
      ? "The AI service is temporarily overloaded. Please wait a few seconds and try again."
      : "Failed to analyze website due to an unexpected error.";

  const enhancedError = new Error(friendlyMessage);
  if (status) {
    (enhancedError as Error & { status?: number }).status = status;
  }
  (enhancedError as Error & { cause?: unknown }).cause = lastError;
  (enhancedError as Error & { code?: string }).code = "AI_SERVICE_UNAVAILABLE";

  throw enhancedError;
}

export async function analyzeWebsite(
  input: AnalyzeWebsiteInput
): Promise<AnalyzeWebsiteOutput> {
  return analyzeWebsiteFlow(input);
}

/* ------------------------------------------------------------------ */
/* Flow: log simple fetch info, then run AI analysis (unchanged)       */
/* ------------------------------------------------------------------ */
const analyzeWebsiteFlow = ai.defineFlow(
  {
    name: "analyzeWebsiteFlow",
    inputSchema: AnalyzeWebsiteInputSchema,
    outputSchema: AnalyzeWebsiteOutputSchema,
  },
  async (input) => {
    try {
      // 1) BASIC DATA (your original)
      const basic = await simpleWebsiteFetch(input.url);

      // 2) SECTION-WISE DATA (new)
      const extra = await fetchSectionWiseData(input.url);
      console.log("extra", extra);

      console.log("===== SIMPLE WEBSITE DATA =====");
      console.dir(
        {
          url: input.url,
          title: basic.title,
          description: basic.description,
          summary: basic.summary,
          contacts: basic.contacts,
          services: basic.services,
        },
        { depth: null }
      );
      console.log("================================\n");

      console.log("===== SECTION-WISE WEBSITE DATA =====");
      console.dir(
        {
          overview: extra.overview,
          headings: extra.headings,
          internalLinks: extra.internalLinks,
          externalLinks: extra.externalLinks,
          images: extra.images,
          sections: extra.sections,
        },
        { depth: null }
      );
      console.log("======================================");
    } catch (err) {
      console.error("Website fetch failed:", err);
    }

    // this is a analyze for seo 
    const { output } = await analyzeWebsitePromptWithRetry(input, {
      retries: 3,
      delayMs: 2000,
    });
    console.log("genrate-website-analysis", output);
    return output!;
  }
);

export { analyzeWebsiteFlow };

