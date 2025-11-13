import { ai } from "../../../ai/genkit";
import { z } from "genkit";

const AnalyzeWebsiteInputSchema = z.object({
  url: z.string().url().describe("The URL of the website to analyze."),
});
type AnalyzeWebsiteInput = z.infer<typeof AnalyzeWebsiteInputSchema>;

const IssueDetailSchema = z.object({
  id: z
    .string()
    .describe("A short kebab-case identifier for the issue (e.g., missing-meta-description)."),
  summary: z
    .string()
    .describe("Short headline for the issue, ideal for list display."),
  description: z
    .string()
    .describe("1-2 sentence explanation of what the scanner detected."),
  affectedPage: z
    .string()
    .optional()
    .describe("Primary page or URL path where the issue happens (e.g., /, /about)."),
  affectedElement: z
    .string()
    .optional()
    .describe("Relevant selector, tag, or component hint (e.g., <meta name=\"description\">)."),
  impact: z
    .string()
    .optional()
    .describe("Explain why this matters for SEO, UX, performance, etc."),
  recommendedFix: z
    .string()
    .describe("Clear steps the user should take to resolve the issue in plain language."),
  codeExample: z
    .string()
    .optional()
    .describe("Code snippet or configuration example that demonstrates an ideal fix. Keep under 20 lines."),
  references: z
    .array(z.string())
    .optional()
    .describe("Optional list of helpful links or tools for the user to learn more."),
});
type IssueDetail = z.infer<typeof IssueDetailSchema>;

const AnalyzeWebsiteOutputSchema = z.object({
  seoIssues: z.array(IssueDetailSchema),
  uiUxProblems: z.array(IssueDetailSchema),
  imageOptimizationOpportunities: z.array(IssueDetailSchema),
  securityWarnings: z.array(IssueDetailSchema),
  performanceScore: z
    .number()
    .describe("Overall performance score on a 0-100 scale (similar to Lighthouse)."),
  accessibilityIssues: z.array(IssueDetailSchema),
  contentDuplicationIssues: z.array(IssueDetailSchema),
  brokenLinks: z.array(IssueDetailSchema),
});
type AnalyzeWebsiteOutput = z.infer<typeof AnalyzeWebsiteOutputSchema>;

const analyzeWebsitePrompt = ai.definePrompt({
  name: "analyzeWebsitePrompt",
  input: { schema: AnalyzeWebsiteInputSchema },
  output: { schema: AnalyzeWebsiteOutputSchema },
  prompt: `You are an AI website analysis expert. Analyze the website at the given URL and return JSON that exactly matches this TypeScript type:

type IssueDetail = {
  id: string;                // short kebab-case identifier, unique per issue
  summary: string;           // human-friendly headline
  description: string;       // what you found
  affectedPage?: string;     // main page or path
  affectedElement?: string;  // tag, selector, or component that needs attention
  impact?: string;           // why it matters
  recommendedFix: string;    // actionable guidance
  codeExample?: string;      // concise code or config snippet (<= 20 lines)
  references?: string[];     // optional helpful links/resources
};

Return:
{
  "seoIssues": IssueDetail[],
  "uiUxProblems": IssueDetail[],
  "imageOptimizationOpportunities": IssueDetail[],
  "securityWarnings": IssueDetail[],
  "performanceScore": number,
  "accessibilityIssues": IssueDetail[],
  "contentDuplicationIssues": IssueDetail[],
  "brokenLinks": IssueDetail[]
}

For each issue:
- Prefer concise, self-explanatory summaries.
- Fill affectedPage with either a full URL or the path where the problem was observed.
- Use affectedElement to highlight the relevant selector or component when possible.
- recommendedFix must contain practical steps, not just theory.
- Provide codeExample whenever a small snippet would help the developer implement the fix.
- Keep codeExample under 20 lines and properly formatted.
- Only include references when a reputable resource would genuinely help.

URL to analyze: {{{url}}}`,
});

export {
  analyzeWebsitePrompt,
  AnalyzeWebsiteInputSchema,
  AnalyzeWebsiteOutputSchema,
  IssueDetailSchema,
};
export type {
  AnalyzeWebsiteInput,
  AnalyzeWebsiteOutput,
  IssueDetail,
};
