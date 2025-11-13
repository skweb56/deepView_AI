"use server";

import { analyzeWebsite, type AnalyzeWebsiteInput } from "./ai/flows/generate-website-analysis";
import { generateFixes, type GenerateFixesInput } from "./ai/flows/generate-fixes";
import { generateContent, type GenerateContentInput } from "./ai/flows/generate-content";
import { generateVideoExplanation, type GenerateVideoExplanationInput } from "./ai/flows/generate-video-explanation";
import {
  analyzePageWise,
  type PageWiseAnalysisInput,
  type PageWiseAnalysisOutput,
} from "./ai/flows/generate-pagewise-analysis";
import { discoverPages, type DiscoveredPage } from "./ai/flows/utils/pageDiscovery";
import {
  generateSocialPlan,
  type GenerateSocialPlanInput,
  type GenerateSocialPlanOutput,
} from "./ai/flows/generate-social-plan";

export async function performWebsiteAnalysis(input: AnalyzeWebsiteInput) {
  try {
    const result = await analyzeWebsite(input);
    return result;
  } catch (error) {
    console.error("Error performing website analysis:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to analyze website.");
  }
}

export async function performPageWiseAnalysis(input: PageWiseAnalysisInput): Promise<PageWiseAnalysisOutput> {
  try {
    const result = await analyzePageWise(input);
    return result;
  } catch (error) {
    console.error("Error performing page-wise analysis:", error);
    throw new Error("Failed to analyze pages.");
  }
}

export async function discoverWebsitePages(input: { url: string; maxPages?: number }): Promise<DiscoveredPage[]> {
  try {
    const pages = await discoverPages(input.url, input.maxPages || 20);
    return pages;
  } catch (error) {
    console.error("Error discovering website pages:", error);
    throw new Error("Failed to discover website pages.");
  }
}

export async function generateFixesForIssue(input: GenerateFixesInput) {
  try {
    const result = await generateFixes(input);
    return result;
  } catch (error) {
    console.error("Error generating fixes:", error);
    throw new Error("Failed to generate fixes.");
  }
}

export async function generateSeoContent(input: GenerateContentInput) {
  try {
    const result = await generateContent(input);
    return result;
  } catch (error) {
    console.error("Error generating SEO content:", error);
    throw new Error("Failed to generate SEO content.");
  }
}

export async function generateVideo(input: GenerateVideoExplanationInput) {
  try {
    const result = await generateVideoExplanation(input);
    return result;
  } catch (error) {
    console.error("Error generating video explanation:", error);
    throw new Error("Failed to generate video.");
  }
}

export async function generateSocialPrompts(
  input: GenerateSocialPlanInput
): Promise<GenerateSocialPlanOutput> {
  try {
    const result = await generateSocialPlan(input);
    return result;
  } catch (error) {
    console.error("Error generating social prompts:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate social prompts.");
  }
}
