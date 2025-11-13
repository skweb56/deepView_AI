import type { WebsiteAnalysisReport, WebsiteIssueDetail } from '../../lib/types';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { ScoreRing } from './ScoreRing';
import { IssueCategoryCard } from './IssueCategoryCard';
import { ContentOptimizer } from './ContentOptimizer';
import { VideoGenerator } from './VideoGenerator';
import { Search, Palette, Image as ImageIcon, Shield, PersonStanding, Copy, Link2Off, FileText, Bot, Film, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';

type LegacyIssue = WebsiteIssueDetail | string;

const FALLBACK_GUIDANCE =
  'No recommended guidance was provided. Click "Generate step-by-step fix" to let the AI craft detailed instructions.';

const normalizeIssue = (
  issue: LegacyIssue,
  index: number,
  categoryKey: string
): WebsiteIssueDetail => {
  if (typeof issue === 'string') {
    return {
      id: `${categoryKey}-${index}`,
      summary: issue,
      description: issue,
      recommendedFix: FALLBACK_GUIDANCE,
    };
  }

  return {
    id: issue.id ?? `${categoryKey}-${index}`,
    summary: issue.summary ?? issue.description ?? 'Issue detected',
    description: issue.description ?? issue.summary ?? 'No description provided.',
    affectedPage: issue.affectedPage,
    affectedElement: issue.affectedElement,
    impact: issue.impact,
    recommendedFix: issue.recommendedFix ?? FALLBACK_GUIDANCE,
    codeExample: issue.codeExample,
    references: issue.references,
  };
};

const normalizeIssues = (
  issues: LegacyIssue[] | undefined,
  categoryKey: string
): WebsiteIssueDetail[] => {
  if (!issues || issues.length === 0) {
    return [];
  }
  return issues.map((issue, index) => normalizeIssue(issue, index, categoryKey));
};

type AnalysisDashboardProps = {
  report: WebsiteAnalysisReport;
  url: string;
};

export function AnalysisDashboard({ report, url }: AnalysisDashboardProps) {
  const analysisSummary = JSON.stringify(report, null, 2);

  const issueCategories: Array<{
    title: string;
    data: WebsiteIssueDetail[];
    icon: LucideIcon;
    categoryKey: string;
  }> = [
    { title: 'SEO Issues', data: normalizeIssues(report.seoIssues as LegacyIssue[], 'seo'), icon: Search, categoryKey: 'seo' },
    { title: 'UI/UX Problems', data: normalizeIssues(report.uiUxProblems as LegacyIssue[], 'uiux'), icon: Palette, categoryKey: 'uiux' },
    { title: 'Image Optimizations', data: normalizeIssues(report.imageOptimizationOpportunities as LegacyIssue[], 'image'), icon: ImageIcon, categoryKey: 'image' },
    { title: 'Security Warnings', data: normalizeIssues(report.securityWarnings as LegacyIssue[], 'security'), icon: Shield, categoryKey: 'security' },
    { title: 'Accessibility Issues', data: normalizeIssues(report.accessibilityIssues as LegacyIssue[], 'accessibility'), icon: PersonStanding, categoryKey: 'accessibility' },
    { title: 'Content Duplication', data: normalizeIssues(report.contentDuplicationIssues as LegacyIssue[], 'content'), icon: Copy, categoryKey: 'content' },
    { title: 'Broken Links', data: normalizeIssues(report.brokenLinks as LegacyIssue[], 'broken-links'), icon: Link2Off, categoryKey: 'broken-links' },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Analysis Report</h1>
          <p className="text-muted-foreground break-all">{url}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/pages?url=${encodeURIComponent(url)}`}>
              <Globe className="mr-2 h-4 w-4" />
              Page-Wise Analysis
            </Link>
          </Button>
          <Badge variant="secondary" className="text-sm py-1 px-3">
            Analysis Complete
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
          <TabsTrigger value="summary"><FileText className="mr-2 h-4 w-4"/>Summary</TabsTrigger>
          <TabsTrigger value="issues"><Bot className="mr-2 h-4 w-4"/>Issues & Fixes</TabsTrigger>
          <TabsTrigger value="content"><Palette className="mr-2 h-4 w-4"/>Content Optimizer</TabsTrigger>
          <TabsTrigger value="video"><Film className="mr-2 h-4 w-4"/>Video Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-8">
           <div className="grid gap-8 lg:grid-cols-3">
             <div className="lg:col-span-1">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Performance Score</CardTitle>
                  <CardDescription>Lighthouse-style performance rating.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScoreRing score={report.performanceScore} />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
               <Card>
                <CardHeader>
                  <CardTitle>Issues Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {issueCategories.filter(cat => cat.data.length > 0).map(category => (
                    <div key={category.title} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <category.icon className="h-5 w-5 text-primary" />
                        <span className="font-medium">{category.title}</span>
                      </div>
                      <Badge variant="outline">{category.data.length} issues</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
           </div>
        </TabsContent>

        <TabsContent value="issues" className="mt-8">
           <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {issueCategories.filter(cat => cat.data.length > 0).map(category => (
                <IssueCategoryCard
                  key={category.title}
                  title={category.title}
                  issues={category.data}
                  Icon={category.icon}
                  categoryKey={category.categoryKey}
                />
              ))}
            </div>
        </TabsContent>

        <TabsContent value="content" className="mt-8">
          <ContentOptimizer analysisSummary={analysisSummary} />
        </TabsContent>

        <TabsContent value="video" className="mt-8">
          <VideoGenerator analysisSummary={analysisSummary} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
