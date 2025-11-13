import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import type { LucideIcon } from "lucide-react";
import { FixGenerator } from "./FixGenerator";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import type { WebsiteIssueDetail } from "../../lib/types";

type DetailBlockProps = {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
};

function DetailBlock({ label, value, children }: DetailBlockProps) {
  if (!value && !children) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm leading-relaxed text-foreground">
        {value ? <p>{value}</p> : children}
      </div>
    </div>
  );
}

type IssueCategoryCardProps = {
  title: string;
  issues: WebsiteIssueDetail[];
  Icon: LucideIcon;
  categoryKey: string;
};

export function IssueCategoryCard({ title, issues, Icon, categoryKey }: IssueCategoryCardProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {issues.map((issue, index) => (
            <AccordionItem value={`${categoryKey}-item-${index}`} key={issue.id ?? `${categoryKey}-${index}`}>
              <AccordionTrigger>{issue.summary}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm">
                  <p className="text-muted-foreground">{issue.description}</p>

                  <div className="space-y-3">
                    <DetailBlock label="Where it appears">
                      <div className="space-y-2">
                        {issue.affectedPage && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Page</Badge>
                            <span className="break-all">{issue.affectedPage}</span>
                          </div>
                        )}
                        {issue.affectedElement && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Element</Badge>
                            <code className="rounded bg-muted px-2 py-1 text-xs">{issue.affectedElement}</code>
                          </div>
                        )}
                      </div>
                    </DetailBlock>

                    <DetailBlock label="Why it matters" value={issue.impact ?? undefined} />
                  </div>

                  <Separator />

                  <FixGenerator issue={issue} category={title} />

                  {issue.references && issue.references.length > 0 && (
                    <DetailBlock label="Helpful resources">
                      <ul className="list-disc space-y-1 pl-5">
                        {issue.references.map((ref, refIndex) => (
                          <li key={refIndex}>
                            <a
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="break-all text-primary hover:underline"
                            >
                              {ref}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </DetailBlock>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
