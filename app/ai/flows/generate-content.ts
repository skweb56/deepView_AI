// src/ai/flows/generate-content.ts
'use server';
/**
 * @fileOverview A flow to generate SEO-ready content suggestions.
 *
 * - generateContent - A function that handles the generation of SEO-ready content.
 * - GenerateContentInput - The input type for the generateContent function.
 * - GenerateContentOutput - The return type for the generateContent function.
 */

import {ai} from '../../ai/genkit';
import {z} from 'genkit';

const GenerateContentInputSchema = z.object({
  currentContent: z.string().describe('The current content of the webpage.'),
  keywords: z.string().describe('The target keywords for the webpage.'),
  topic: z.string().describe('The topic of the webpage.'),
  optimizationMetrics: z.string().describe('Current SEO metrics of the content'),
});
export type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;

const GenerateContentOutputSchema = z.object({
  seoOptimizedContent: z.string().describe('The generated SEO-optimized content.'),
  suggestedTitle: z.string().describe('A suggested SEO-friendly title.'),
  metaDescription: z.string().describe('A suggested meta description.'),
});
export type GenerateContentOutput = z.infer<typeof GenerateContentOutputSchema>;

export async function generateContent(input: GenerateContentInput): Promise<GenerateContentOutput> {
  return generateContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContentPrompt',
  input: {schema: GenerateContentInputSchema},
  output: {schema: GenerateContentOutputSchema},
  prompt: `You are an SEO expert tasked with optimizing webpage content for better search engine ranking.\n\n  Current Content: {{{currentContent}}}\n  Target Keywords: {{{keywords}}}\n  Topic: {{{topic}}}\n  Current Optimization Metrics: {{{optimizationMetrics}}}\n\n  Based on the current content, target keywords, topic, and current optimization metrics, generate SEO-optimized content, a suggested SEO-friendly title, and a meta description. Ensure the generated content is engaging, informative, and incorporates the target keywords naturally.\n\n  Consider these instructions carefully before generating content:
  - Keep the tone professional and easy to understand.
  - Use the target keywords naturally without keyword stuffing.
  - Content should be original and grammatically correct.
  - Suggest a title that is both SEO friendly and engaging for users.
  - Write a meta description that accurately summarizes the content and entices clicks from search results.\n\n  Output the SEO-optimized content, title, and meta description in a clear, structured format.
`,
});

const generateContentFlow = ai.defineFlow(
  {
    name: 'generateContentFlow',
    inputSchema: GenerateContentInputSchema,
    outputSchema: GenerateContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
