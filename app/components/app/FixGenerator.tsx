"use client";

import { useState } from "react";
import { generateFixesForIssue } from "@/app/actions";
import { Button } from "../../components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent } from "../../components/ui/card";
import type { WebsiteIssueDetail } from "../../lib/types";

type FixGeneratorProps = {
  issue: WebsiteIssueDetail;
  category: string;
};

export function FixGenerator({ issue, category }: FixGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fix, setFix] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateFix = async () => {
    setIsLoading(true);
    setFix(null);
    try {
      const analysisContext = [
        `Category: ${category}`,
        `Issue ID: ${issue.id ?? 'unknown'}`,
        `Summary: ${issue.summary}`,
        `Description: ${issue.description}`,
        issue.affectedPage ? `Affected page: ${issue.affectedPage}` : null,
        issue.affectedElement ? `Affected element: ${issue.affectedElement}` : null,
        issue.impact ? `Impact: ${issue.impact}` : null,
        `Recommended steps: ${issue.recommendedFix ?? 'No recommended guidance provided.'}`,
        issue.codeExample ? `Existing code guidance:\n${issue.codeExample}` : null,
      ]
        .filter(Boolean)
        .join("\n\n");

      const result = await generateFixesForIssue({ analysisResults: analysisContext });
      setFix(result.fixes);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Generating Fix",
        description: "There was a problem generating the fix. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background/60 p-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-primary">Quick guidance</h4>
        <p className="text-sm leading-relaxed text-foreground">
          {issue.recommendedFix ?? 'This issue did not include a recommended fix. Click the button below to generate detailed guidance.'}
        </p>
      </div>

      {issue.codeExample && (
        <Card>
          <CardContent className="p-0">
            <pre className="bg-muted p-3 text-sm font-code overflow-x-auto">
              <code>{issue.codeExample}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={handleGenerateFix} disabled={isLoading} size="sm" className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating fix...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate step-by-step fix
            </>
          )}
        </Button>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI is preparing detailed instructions…</span>
          </div>
        )}
      </div>

      {fix && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="text-sm font-semibold">AI suggested fix</h4>
            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto font-code whitespace-pre-wrap">
              <code>{fix}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
