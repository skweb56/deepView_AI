'use server';
/**
 * @fileOverview This file contains the Genkit flow for auto-generating fixes for website issues.
 *
 * - generateFixes - A function that triggers the fix generation process.
 * - GenerateFixesInput - The input type for the generateFixes function, including website analysis results.
 * - GenerateFixesOutput - The return type for the generateFixes function, containing suggested fixes.
 */

import {ai} from '../../ai/genkit';
import {z} from 'genkit';

const GenerateFixesInputSchema = z.object({
  analysisResults: z.string().describe('The analysis results of the website scan, including SEO, UI/UX, and other issues.'),
});
export type GenerateFixesInput = z.infer<typeof GenerateFixesInputSchema>;

const GenerateFixesOutputSchema = z.object({
  fixes: z.string().describe('A detailed description of the suggested fixes, including code diffs and optimized images.'),
});
export type GenerateFixesOutput = z.infer<typeof GenerateFixesOutputSchema>;

export async function generateFixes(input: GenerateFixesInput): Promise<GenerateFixesOutput> {
  return generateFixesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFixesPrompt',
  input: {schema: GenerateFixesInputSchema},
  output: {schema: GenerateFixesOutputSchema},
  prompt: `You are an expert web developer specializing in identifying and resolving website issues.

  Based on the website analysis results provided, generate detailed fixes, including code diffs (React, HTML, CSS) and instructions for optimizing images.

  Analysis Results: {{{analysisResults}}}

  Provide the fixes in a clear, concise, and actionable format. Prioritize the most critical issues and provide efficient solutions.
  `,
});

const generateFixesFlow = ai.defineFlow(
  {
    name: 'generateFixesFlow',
    inputSchema: GenerateFixesInputSchema,
    outputSchema: GenerateFixesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
