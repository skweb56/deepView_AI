import { Suspense } from 'react';
import { performPageWiseAnalysis, discoverWebsitePages } from '../actions';
import { PageWiseDashboard } from '../components/app/PageWiseDashboard';
import { Header } from '../components/app/Header';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader } from '../components/ui/card';

type PagesPageProps = {
  searchParams: Promise<{
    url?: string;
    maxPages?: string;
  }>;
};

async function PagesContent({ url, maxPages }: { url: string; maxPages?: number }) {
  const discoveredPages = await discoverWebsitePages({ url, maxPages });

  const defaultSelectedUrls = discoveredPages
    .filter((page) => page.isCommon)
    .map((page) => page.url);

  const initialReport =
    defaultSelectedUrls.length > 0
      ? await performPageWiseAnalysis({ url, maxPages, selectedUrls: defaultSelectedUrls })
      : null;

  return (
    <PageWiseDashboard
      url={url}
      discoveredPages={discoveredPages}
      initialReport={initialReport}
      defaultSelectedUrls={defaultSelectedUrls}
      maxPages={maxPages}
    />
  );
}

function PagesSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function PagesPage({ searchParams }: PagesPageProps) {
  const params = await searchParams;
  const raw = params?.url;
  const url = Array.isArray(raw) ? raw[0] : raw;
  const maxPagesRaw = params?.maxPages;
  const maxPages = maxPagesRaw ? parseInt(maxPagesRaw, 10) : undefined;

  if (!url) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">No URL provided</h1>
            <p className="text-muted-foreground">Please go back and enter a website URL to analyze pages.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PagesSkeleton />}>
          <PagesContent url={url} maxPages={maxPages} />
        </Suspense>
      </main>
    </div>
  );
}

