"use client";

import { useEffect, useMemo, useState, useTransition } from 'react';
import type { PageWiseAnalysisOutput } from '../../ai/flows/generate-pagewise-analysis';
import type { DiscoveredPage } from '../../ai/flows/utils/pageDiscovery';
import { performPageWiseAnalysis, generateSocialPrompts } from '../../actions';
import type { GenerateSocialPlanOutput } from '../../ai/flows/generate-social-plan';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { 
  FileText, 
  Image as ImageIcon, 
  Link2, 
  ExternalLink, 
  Heading1, 
  FileCheck,
  BarChart3,
  Globe,
  Eye,
  Search,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink as ExternalLinkIcon,
  Hash,
  Layers,
  FileCode,
  Loader2,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

type CheckboxState = boolean | 'indeterminate';

type PageWiseDashboardProps = {
  url: string;
  discoveredPages: DiscoveredPage[];
  initialReport: PageWiseAnalysisOutput | null;
  defaultSelectedUrls: string[];
  maxPages?: number;
};

type ReportLayoutProps = {
  report: PageWiseAnalysisOutput;
  activeTab: string;
  setActiveTab: (value: string) => void;
  selectedPageIndex: number | null;
  setSelectedPageIndex: (value: number | null) => void;
  selectedUrls: Set<string>;
  onTogglePage: (pageUrl: string, checked: boolean) => void;
  discoveredPages: DiscoveredPage[];
  recommendedPages: DiscoveredPage[];
  otherPages: DiscoveredPage[];
  selectedCount: number;
  totalPagesDiscovered: number;
  handleClearAll: () => void;
  handleSelectAll: () => void;
  analyzeSelectedPages: () => void;
  isPending: boolean;
  formatPageLabel: (page: DiscoveredPage) => string;
};

export function PageWiseDashboard({
  url,
  discoveredPages,
  initialReport,
  defaultSelectedUrls,
  maxPages,
}: PageWiseDashboardProps) {
  const recommendedPages = useMemo(
    () => discoveredPages.filter((page) => page.isCommon),
    [discoveredPages]
  );
  const otherPages = useMemo(
    () => discoveredPages.filter((page) => !page.isCommon),
    [discoveredPages]
  );

  const computedDefaultSelection = useMemo(() => {
    if (defaultSelectedUrls.length > 0) {
      return defaultSelectedUrls;
    }
    if (recommendedPages.length > 0) {
      return recommendedPages.map((page) => page.url);
    }
    if (discoveredPages.length > 0) {
      return [discoveredPages[0].url];
    }
    return [];
  }, [defaultSelectedUrls, recommendedPages, discoveredPages]);

  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    () =>
      new Set(
        initialReport
          ? initialReport.pages.map((page) => page.url)
          : computedDefaultSelection
      )
  );
  const [report, setReport] = useState<PageWiseAnalysisOutput | null>(initialReport);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
    }
  }, [initialReport]);

  useEffect(() => {
    if (computedDefaultSelection.length === 0) return;
    setSelectedUrls((prev) => {
      if (prev.size > 0) return prev;
      return new Set(computedDefaultSelection);
    });
  }, [computedDefaultSelection]);

  const handleTogglePage = (pageUrl: string, checked: boolean) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(pageUrl);
      } else {
        next.delete(pageUrl);
      }
      if (errorMessage && next.size > 0) {
        setErrorMessage(null);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedUrls(new Set(discoveredPages.map((page) => page.url)));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleClearAll = () => {
    setSelectedUrls(new Set());
  };

  const analyzeSelectedPages = () => {
    if (selectedUrls.size === 0) {
      setErrorMessage("Select at least one page to run the analysis.");
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      try {
        const data = await performPageWiseAnalysis({
          url,
          selectedUrls: Array.from(selectedUrls),
          maxPages,
        });
        setReport(data);
        setActiveTab('overview');
        setSelectedPageIndex(null);
      } catch (error) {
        console.error("Failed to analyze selected pages:", error);
        setErrorMessage("Failed to analyze selected pages. Please try again.");
      }
    });
  };

  const selectedCount = selectedUrls.size;
  const totalPagesDiscovered = discoveredPages.length;

  const formatPageLabel = (page: DiscoveredPage) => {
    if (page.title && page.title.trim().length > 0) return page.title.trim();
    if (page.slug) {
      const cleaned = page.slug.replace(/[-_]+/g, ' ').trim();
      if (cleaned.length > 0) {
        return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
      }
    }
    return page.url;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold font-headline">Page-Wise Analysis</h1>
          <p className="text-muted-foreground break-all mt-1">{url}</p>
        </div>
        <Badge variant="secondary" className="text-sm py-1 px-3 w-fit">
          {selectedCount} / {totalPagesDiscovered} pages selected
        </Badge>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {report ? (
        <ReportLayout
          report={report}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedPageIndex={selectedPageIndex}
          setSelectedPageIndex={setSelectedPageIndex}
          selectedUrls={selectedUrls}
          onTogglePage={handleTogglePage}
          discoveredPages={discoveredPages}
          recommendedPages={recommendedPages}
          otherPages={otherPages}
          selectedCount={selectedCount}
          totalPagesDiscovered={totalPagesDiscovered}
          handleClearAll={handleClearAll}
          handleSelectAll={handleSelectAll}
          analyzeSelectedPages={analyzeSelectedPages}
          isPending={isPending}
          formatPageLabel={formatPageLabel}
        />
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select pages to analyze</CardTitle>
            <CardDescription>
              Commonly used pages are pre-selected. Choose additional pages and run the analysis when you're ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended pages
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {recommendedPages.length}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {recommendedPages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No recommended pages detected. Select the pages you want to analyze below.
                    </p>
                  ) : (
                    recommendedPages.map((page, index) => {
                      const id = `recommended-${index}`;
                      const isChecked = selectedUrls.has(page.url);
                      return (
                        <label
                          key={page.url}
                          htmlFor={id}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                            isChecked
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-border hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            id={id}
                            checked={isChecked}
                            onCheckedChange={(checked: CheckboxState) =>
                              handleTogglePage(page.url, checked === true)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={id} className="font-medium leading-tight">
                              {formatPageLabel(page)}
                            </Label>
                            <p className="text-xs text-muted-foreground break-all">
                              {page.path}
                            </p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Other pages
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {otherPages.length}
                  </span>
                </div>
                <ScrollArea className="mt-3 max-h-60 pr-3">
                  <div className="space-y-2">
                    {otherPages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No additional pages detected.
                      </p>
                    ) : (
                      otherPages.map((page, index) => {
                        const id = `other-${index}`;
                        const isChecked = selectedUrls.has(page.url);
                        return (
                          <label
                            key={page.url}
                            htmlFor={id}
                            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                              isChecked
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              id={id}
                              checked={isChecked}
                              onCheckedChange={(checked: CheckboxState) =>
                                handleTogglePage(page.url, checked === true)
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <Label htmlFor={id} className="font-medium leading-tight">
                                {formatPageLabel(page)}
                              </Label>
                              <p className="text-xs text-muted-foreground break-all">
                                {page.path}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {selectedCount} page{selectedCount === 1 ? '' : 's'} selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={isPending || selectedCount === 0}
                >
                  Clear all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isPending || selectedCount === totalPagesDiscovered || totalPagesDiscovered === 0}
                >
                  Select all
                </Button>
                <Button
                  onClick={analyzeSelectedPages}
                  disabled={isPending || selectedCount === 0}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze selected pages'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportLayout({
  report,
  activeTab,
  setActiveTab,
  selectedPageIndex,
  setSelectedPageIndex,
  selectedUrls,
  onTogglePage,
  discoveredPages,
  recommendedPages,
  otherPages,
  selectedCount,
  totalPagesDiscovered,
  handleClearAll,
  handleSelectAll,
  analyzeSelectedPages,
  isPending,
  formatPageLabel,
}: ReportLayoutProps) {
  const stats = [
    {
      label: 'Total Pages',
      value: report.totalPages,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      label: 'Total Words',
      value: report.summary.totalWordCount.toLocaleString(),
      icon: FileCheck,
      color: 'text-green-500',
    },
    {
      label: 'Total Images',
      value: report.summary.totalImages,
      icon: ImageIcon,
      color: 'text-purple-500',
    },
    {
      label: 'Internal Links',
      value: report.summary.totalInternalLinks,
      icon: Link2,
      color: 'text-orange-500',
    },
    {
      label: 'External Links',
      value: report.summary.totalExternalLinks,
      icon: ExternalLink,
      color: 'text-red-500',
    },
    {
      label: 'Total Headings',
      value: report.summary.totalHeadings,
      icon: Heading1,
      color: 'text-indigo-500',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold font-headline">Analysis summary</h2>
          <p className="text-muted-foreground break-all mt-1">{report.baseUrl}</p>
        </div>
        <Badge variant="secondary" className="text-sm py-1 px-3 w-fit">
          {report.totalPages} pages analyzed
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <CardDescription className="text-xs">{stat.label}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pages">
            <FileText className="mr-2 h-4 w-4" />
            All Pages
          </TabsTrigger>
          <TabsTrigger value="details">
            <Eye className="mr-2 h-4 w-4" />
            Page Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Website Summary</CardTitle>
                <CardDescription>Overall statistics across all pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Average Words per Page</span>
                  <Badge variant="outline">{report.summary.averageWordCount.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Total Pages Analyzed</span>
                  <Badge variant="outline">{report.totalPages}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Base URL</span>
                  <Badge variant="secondary" className="text-xs max-w-[200px] truncate">
                    {new URL(report.baseUrl).hostname}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Distribution</CardTitle>
                <CardDescription>Breakdown of content elements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Images</span>
                    <span className="font-medium">{report.summary.totalImages}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.min((report.summary.totalImages / (report.summary.totalImages + report.summary.totalHeadings)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Headings</span>
                    <span className="font-medium">{report.summary.totalHeadings}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{
                        width: `${Math.min((report.summary.totalHeadings / (report.summary.totalImages + report.summary.totalHeadings)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="mt-8">
          <div className="space-y-6">
            {/* Select pages to analyze - Moved here from top */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Select pages to analyze</CardTitle>
                <CardDescription>
                  Commonly used pages are pre-selected. Choose additional pages and run the analysis when you're ready.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Recommended pages
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {recommendedPages.length}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {recommendedPages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No recommended pages detected. Select the pages you want to analyze below.
                        </p>
                      ) : (
                        recommendedPages.map((page, index) => {
                          const id = `recommended-${index}`;
                          const isChecked = selectedUrls.has(page.url);
                          return (
                            <label
                              key={page.url}
                              htmlFor={id}
                              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                                isChecked
                                  ? 'border-primary/60 bg-primary/5'
                                  : 'border-border hover:bg-muted/50'
                              }`}
                            >
                              <Checkbox
                                id={id}
                                checked={isChecked}
                                onCheckedChange={(checked: CheckboxState) =>
                                  onTogglePage(page.url, checked === true)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={id} className="font-medium leading-tight">
                                  {formatPageLabel(page)}
                                </Label>
                                <p className="text-xs text-muted-foreground break-all">
                                  {page.path}
                                </p>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Other pages
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {otherPages.length}
                      </span>
                    </div>
                    <ScrollArea className="mt-3 max-h-60 pr-3">
                      <div className="space-y-2">
                        {otherPages.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No additional pages detected.
                          </p>
                        ) : (
                          otherPages.map((page, index) => {
                            const id = `other-${index}`;
                            const isChecked = selectedUrls.has(page.url);
                            return (
                              <label
                                key={page.url}
                                htmlFor={id}
                                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                                  isChecked
                                    ? 'border-primary/60 bg-primary/5'
                                    : 'border-border hover:bg-muted/50'
                                }`}
                              >
                                <Checkbox
                                  id={id}
                                  checked={isChecked}
                                  onCheckedChange={(checked: CheckboxState) =>
                                    onTogglePage(page.url, checked === true)
                                  }
                                />
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={id} className="font-medium leading-tight">
                                    {formatPageLabel(page)}
                                  </Label>
                                  <p className="text-xs text-muted-foreground break-all">
                                    {page.path}
                                  </p>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {selectedCount} page{selectedCount === 1 ? '' : 's'} selected
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={isPending || selectedCount === 0}
                    >
                      Clear all
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={isPending || selectedCount === totalPagesDiscovered || totalPagesDiscovered === 0}
                    >
                      Select all
                    </Button>
                    <Button
                      onClick={analyzeSelectedPages}
                      disabled={isPending || selectedCount === 0}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze selected pages'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyzed Pages Grid */}
            {report.pages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Analyzed Pages</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {report.pages.map((page, index) => (
                    <Card
                      key={page.url}
                      className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                        selectedPageIndex === index ? 'ring-2 ring-primary shadow-lg' : ''
                      }`}
                      onClick={() => {
                        setSelectedPageIndex(index);
                        setActiveTab('details');
                      }}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-2">
                              {page.title || `Page ${index + 1}`}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 line-clamp-1 break-all">
                              {page.url}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0">
                            #{index + 1}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Words</span>
                            <span className="font-medium">{page.wordCount.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Headings</span>
                            <span className="font-medium">{page.headings.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Images</span>
                            <span className="font-medium">{page.images.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Links</span>
                            <span className="font-medium">
                              {page.internalLinks.length + page.externalLinks.length}
                            </span>
                          </div>
                        </div>
                        {page.summary && (
                          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                            {page.summary}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-8">
          {selectedPageIndex !== null && report.pages[selectedPageIndex] ? (
            <PageDetails 
              page={report.pages[selectedPageIndex]} 
              index={selectedPageIndex}
              onBack={() => {
                setActiveTab('pages');
                setSelectedPageIndex(null);
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a page from the "All Pages" tab to view detailed information
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PageDetails({ 
  page, 
  index,
  onBack 
}: { 
  page: PageWiseAnalysisOutput['pages'][0]; 
  index: number;
  onBack: () => void;
}) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [socialPlan, setSocialPlan] = useState<GenerateSocialPlanOutput | null>(null);
  const [socialPlanError, setSocialPlanError] = useState<string | null>(null);
  const [isGeneratingSocialPlan, startGeneratingSocialPlan] = useTransition();

  const truncate = (value: string | null | undefined, maxLength = 160) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return trimmed.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
  };

  const keySectionHighlights = useMemo(() => {
    return page.sections
      .filter((section) => (section.heading && section.heading.trim().length > 0) || (section.content && section.content.trim().length > 0))
      .slice(0, 4)
      .map((section, index) => {
        const heading = section.heading?.trim() || `Section ${index + 1}`;
        const contentSnippet = truncate(section.content, 140) || 'No additional context available.';
        return `${heading}: ${contentSnippet}`;
      });
  }, [page.sections]);

  const socialPromptPreview = useMemo<string>(() => {
    const lines: string[] = [];
    lines.push(
      'You are a social media strategist tasked with crafting a three-day campaign of engaging Reels and companion posts.'
    );
    lines.push(`Page title: ${page.title ?? `Page ${index + 1}`}`);
    lines.push(`Page URL: ${page.url}`);

    console.log("page",page)

    const summaryText = truncate(page.summary ?? page.description, 320);
    if (summaryText) {
      lines.push(`Page summary: ${summaryText}`);
    }

    if (keySectionHighlights.length > 0) {
      lines.push(
        'Key highlights to incorporate:\n' +
          keySectionHighlights.map((entry) => `- ${entry}`).join('\n')
      );
    }

    lines.push(
      'Deliver exactly three daily plans. Each day must include: theme, reel hook, detailed reel prompt (mention visuals, scenes, voiceover cues), post idea, post caption, 3-10 hashtags, and a tailored call to action.'
    );
    lines.push(
      `Tone: Professional, friendly, story-driven, and conversion-focused. Audience: Prospective customers exploring ${page.title ?? 'this offering'}.`
    );

    return lines.join('\n\n');
  }, [page, index, keySectionHighlights]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGenerateSocialPlan = () => {
    startGeneratingSocialPlan(async () => {
      setSocialPlanError(null);
      try {
        const keySections = page.sections
          .filter((section) => section.content || section.heading)
          .slice(0, 6)
          .map((section) => ({
            heading: section.heading,
            content: section.content,
          }));

        const plan = await generateSocialPrompts({
          pageTitle: page.title ?? `Page ${index + 1}`,
          pageUrl: page.url,
          summary: page.summary ?? page.description ?? "",
          keySections,
          audience: "Prospective customers researching " + (page.title ?? "this service"),
          tone: "Professional, friendly, story-driven and conversion focused",
        });

        setSocialPlan(plan);
      } catch (error) {
        console.error("Failed to generate social prompts:", error);
        if (error instanceof Error) {
          setSocialPlanError(error.message);
        } else {
          setSocialPlanError("Failed to generate social prompts. Please try again.");
        }
      }
    });
  };

  const stats = [
    {
      label: 'Words',
      value: page.wordCount.toLocaleString(),
      icon: FileCheck,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Headings',
      value: page.headings.length,
      icon: Heading1,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Images',
      value: page.images.length,
      icon: ImageIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Internal Links',
      value: page.internalLinks.length,
      icon: Link2,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'External Links',
      value: page.externalLinks.length,
      icon: ExternalLink,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Sections',
      value: page.sections.length,
      icon: Layers,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pages
        </Button>
      </div>

      {/* Professional Page Header */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="text-sm font-semibold">
                  Page #{index + 1}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {new URL(page.url).pathname || '/'}
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold mb-3">
                {page.title || `Page ${index + 1}`}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {page.url}
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(page.url, 'url')}
                >
                  {copiedText === 'url' ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`p-4 rounded-lg border ${stat.bgColor} transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Description & Summary */}
      {(page.description || page.summary) && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {page.description && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-primary" />
                  <CardTitle>Meta Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                  {page.description}
                </p>
              </CardContent>
            </Card>
          )}

          {page.summary && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Content Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg border-l-4 border-blue-500">
                  {page.summary}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Social Content Planner */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Social Prompt Plan</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <CalendarDays className="h-3 w-3" />
              Auto-generated
            </Badge>
          </div>
          <CardDescription className="mt-2">
            Review the prompt below, then generate Reels and post ideas inspired by this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt preview */}
          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Prompt preview
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1"
                onClick={() => copyToClipboard(socialPromptPreview, 'prompt')}
              >
                {copiedText === 'prompt' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="text-xs">Copy</span>
              </Button>
            </div>
            <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg border-l-4 border-primary/30 whitespace-pre-wrap">
              {socialPromptPreview}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              onClick={handleGenerateSocialPlan}
              disabled={isGeneratingSocialPlan}
              className="w-full sm:w-auto"
            >
              {isGeneratingSocialPlan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating prompts...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate 3-day plan
                </>
              )}
            </Button>
            {socialPlanError && (
              <p className="text-sm text-destructive">{socialPlanError}</p>
            )}
          </div>

          {socialPlan && (
            <div className="space-y-6">
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Campaign overview
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1"
                    onClick={() => copyToClipboard(socialPlan.overview, 'overview')}
                  >
                    {copiedText === 'overview' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="text-xs">Copy</span>
                  </Button>
                </div>
                <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg border-l-4 border-blue-400/30 whitespace-pre-wrap">
                  {socialPlan.overview}
                </p>
              </div>

              <div className="space-y-6">
                {socialPlan.days.map((day, idx) => (
                  <Card key={`${day.day}-${idx}`} className="border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs font-medium">
                            {day.day}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{day.theme}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Reel + Post
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold">Reel Prompt</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 gap-1"
                            onClick={() => copyToClipboard(day.reelPrompt, `reel-${idx}`)}
                          >
                            {copiedText === `reel-${idx}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="text-xs">Copy</span>
                          </Button>
                        </div>
                        <p className="text-xs font-medium text-primary">{day.reelHook}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded-lg border-l-4 border-primary/40">
                          {day.reelPrompt}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold">Post Caption</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 gap-1"
                            onClick={() => copyToClipboard(day.postCaption, `caption-${idx}`)}
                          >
                            {copiedText === `caption-${idx}` ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                            <span className="text-xs">Copy</span>
                          </Button>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">{day.postIdea}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/40 p-3 rounded-lg border-l-4 border-blue-400/40">
                          {day.postCaption}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {day.hashtags.map((tag, tagIdx) => (
                            <Badge key={tagIdx} variant="outline" className="text-xs font-mono">
                              #{tag.replace(/^#/, "")}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">CTA: </span>
                        {day.callToAction}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Headings Structure */}
      {/* {page.headings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                <CardTitle>Headings Hierarchy</CardTitle>
              </div>
              <Badge variant="secondary">{page.headings.length} headings</Badge>
            </div>
            <CardDescription className="mt-1">
              Document structure and content organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {page.headings.map((heading, i) => {
                  const levelColors = {
                    1: 'border-l-blue-500 bg-blue-500/5',
                    2: 'border-l-green-500 bg-green-500/5',
                    3: 'border-l-orange-500 bg-orange-500/5',
                    4: 'border-l-purple-500 bg-purple-500/5',
                    5: 'border-l-pink-500 bg-pink-500/5',
                    6: 'border-l-gray-500 bg-gray-500/5',
                  };
                  const colorClass = levelColors[heading.level as keyof typeof levelColors] || levelColors[6];
                  
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all hover:shadow-sm ${colorClass}`}
                      style={{ marginLeft: `${(heading.level - 1) * 12}px` }}
                    >
                      <Badge 
                        variant="outline" 
                        className="shrink-0 font-mono text-xs"
                      >
                        H{heading.level}
                      </Badge>
                      <span className="text-sm font-medium leading-relaxed flex-1">
                        {heading.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )} */}

      {/* Page Sections */}
      {page.sections.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle>Page Sections</CardTitle>
              </div>
              <Badge variant="secondary">{page.sections.length} sections</Badge>
            </div>
            <CardDescription className="mt-1">
              Content blocks and structural elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {page.sections.map((section, i) => (
                <AccordionItem 
                  key={i} 
                  value={`section-${i}`}
                  className="border rounded-lg mb-2 px-4 data-[state=open]:bg-muted/30"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      {section.heading ? (
                        <>
                          <Badge variant="outline" className="font-mono text-xs">
                            H{section.level}
                          </Badge>
                          <span className="text-left font-medium">{section.heading}</span>
                        </>
                      ) : (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            Section {i + 1}
                          </Badge>
                          <span className="text-muted-foreground text-sm">No heading</span>
                        </>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {section.content && (
                      <div className="space-y-3">
                        <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg">
                          {section.content}
                        </p>
                      </div>
                    )}
                    {section.id && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Hash className="h-3 w-3 text-muted-foreground" />
                        <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                          #{section.id}
                        </code>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Links Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {page.internalLinks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-orange-500" />
                  <CardTitle>Internal Links</CardTitle>
                </div>
                <Badge variant="secondary">{page.internalLinks.length}</Badge>
              </div>
              <CardDescription className="mt-1">
                Links pointing to pages within the same domain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {page.internalLinks.slice(0, 30).map((link, i) => (
                    <div
                      key={i}
                      className="group p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={link.abs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm font-medium text-primary hover:underline truncate mb-1">
                            {link.text || 'No anchor text'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            {new URL(link.abs).pathname}
                          </p>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(link.abs, `internal-${i}`)}
                        >
                          {copiedText === `internal-${i}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {page.internalLinks.length > 30 && (
                    <div className="text-center pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        +{page.internalLinks.length - 30} more internal links
                      </Badge>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {page.externalLinks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLinkIcon className="h-5 w-5 text-red-500" />
                  <CardTitle>External Links</CardTitle>
                </div>
                <Badge variant="secondary">{page.externalLinks.length}</Badge>
              </div>
              <CardDescription className="mt-1">
                Links pointing to external domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {page.externalLinks.slice(0, 30).map((link, i) => (
                    <div
                      key={i}
                      className="group p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-red-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={link.abs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm font-medium text-primary hover:underline truncate mb-1 flex items-center gap-1">
                            {link.text || 'No anchor text'}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </p>
                          <p className="text-xs text-muted-foreground truncate font-mono">
                            {new URL(link.abs).hostname}
                          </p>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(link.abs, `external-${i}`)}
                        >
                          {copiedText === `external-${i}` ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {page.externalLinks.length > 30 && (
                    <div className="text-center pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        +{page.externalLinks.length - 30} more external links
                      </Badge>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Images */}
      {page.images.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-500" />
                <CardTitle>Images</CardTitle>
              </div>
              <Badge variant="secondary">{page.images.length} images</Badge>
            </div>
            <CardDescription className="mt-1">
              Image elements with alt text analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {page.images.slice(0, 50).map((img, i) => (
                  <div
                    key={i}
                    className="group p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-purple-500/10 shrink-0">
                        <ImageIcon className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className={`text-sm font-medium ${img.alt ? 'text-foreground' : 'text-red-500'}`}>
                            {img.alt || (
                              <span className="italic">⚠️ Missing alt text</span>
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(img.abs, `image-${i}`)}
                          >
                            {copiedText === `image-${i}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <a
                          href={img.abs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block font-mono bg-muted/50 p-2 rounded"
                        >
                          {img.abs}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {page.images.length > 50 && (
                  <div className="text-center pt-3 border-t">
                    <Badge variant="outline" className="text-xs">
                      +{page.images.length - 50} more images
                    </Badge>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

