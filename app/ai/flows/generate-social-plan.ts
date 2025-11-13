"use server";

import { ai } from "../../ai/genkit";
import { z } from "genkit";

const KeySectionSchema = z.object({
  heading: z.string().nullable(),
  content: z.string().nullable(),
});

const GenerateSocialPlanInputSchema = z.object({
  pageTitle: z.string().min(1, "Page title is required."),
  pageUrl: z.string().url("A valid page URL is required."),
  summary: z.string().optional(),
  keySections: z.array(KeySectionSchema).max(8).default([]),
  audience: z.string().default("Prospective customers"),
  tone: z
    .string()
    .default("Professional, friendly, and conversion-focused"),
});

const SocialDayPlanSchema = z.object({
  day: z
    .string()
    .describe("Human readable label such as Day 1, Monday, etc."),
  theme: z
    .string()
    .describe("Unifying focus for the day's content."),
  reelHook: z
    .string()
    .describe("One-sentence hook to grab attention in the Reel."),
  reelPrompt: z
    .string()
    .describe("Detailed prompt to feed an AI video or script generator."),
  postIdea: z
    .string()
    .describe("Concept for the static post or carousel."),
  postCaption: z
    .string()
    .describe("Caption copy ready to post."),
  hashtags: z
    .array(z.string())
    .min(3, "Include at least 3 hashtags.")
    .max(10, "Keep hashtags concise."),
  callToAction: z
    .string()
    .describe("Specific CTA for the audience that matches this day."),
});

const GenerateSocialPlanOutputSchema = z.object({
  overview: z
    .string()
    .describe("Short paragraph describing the overall 3-day campaign angle."),
  days: z
    .array(SocialDayPlanSchema)
    .min(3, "Always plan for three days.")
    .max(3, "Limit plan to exactly three days."),
});

export type GenerateSocialPlanInput = z.infer<typeof GenerateSocialPlanInputSchema>;
export type SocialDayPlan = z.infer<typeof SocialDayPlanSchema>;
export type GenerateSocialPlanOutput = z.infer<typeof GenerateSocialPlanOutputSchema>;

const prompt = ai.definePrompt({
  name: "generateSocialPlanPrompt",
  input: { schema: GenerateSocialPlanInputSchema },
  output: { schema: GenerateSocialPlanOutputSchema },
  prompt: `You are an experienced social media strategist focused on short-form video (Reels) and Instagram/Facebook posts.

Using the provided page content, craft a three-day social media prompt plan that can be fed into generative tools.

Guidelines:
- Tailor ideas to the brand based on the page information.
- The audience is {{{audience}}}. Tone should be {{{tone}}}.
- Each of the three days must include: theme, reelHook, reelPrompt, postIdea, postCaption, hashtags (3-10), callToAction.
- reelPrompt should be detailed enough for an AI tool to generate a script or shot list (mention visuals, scenes, voiceover cues).
- postCaption should be ready to publish and align with the day's theme and CTA.
- Use the keySections to ground prompts in factual page content.

Page overview:
- Title: {{{pageTitle}}}
- URL: {{{pageUrl}}}
- Summary: {{{summary}}}
- Key sections: {{#each keySections}}
  - Heading: {{{heading}}}
    Content: {{{content}}}
  {{/each}}

Return ONLY valid JSON that conforms exactly to the supplied schema.`,
});

export async function generateSocialPlan(
  input: GenerateSocialPlanInput
): Promise<GenerateSocialPlanOutput> {
  return generateSocialPlanFlow(input);
}

const generateSocialPlanFlow = ai.defineFlow(
  {
    name: "generateSocialPlanFlow",
    inputSchema: GenerateSocialPlanInputSchema,
    outputSchema: GenerateSocialPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

