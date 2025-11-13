import { Suspense } from 'react';
import { performWebsiteAnalysis } from '../actions';
import { AnalysisDashboard } from '../components/app/AnalysisDashboard';
import { Header } from '../components/app/Header';
import { Skeleton } from '../components/ui/skeleton';
import { Card, CardContent, CardHeader } from '../components/ui/card';

type AnalysisPageProps = {
  searchParams: Promise<{
    url?: string;
  }>;
};

async function AnalysisContent({ url }: { url: string }) {
  const report = await performWebsiteAnalysis({ url });
  return <AnalysisDashboard report={report} url={url} />;
}

function AnalysisSkeleton() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <Card>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-32 w-full" /></CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
  const params = await searchParams;
  const raw = params?.url;
  const url = Array.isArray(raw) ? raw[0] : raw;

  if (!url) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">No URL provided</h1>
            <p className="text-muted-foreground">Please go back and enter a website URL to analyze.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<AnalysisSkeleton />}>
          <AnalysisContent url={url} />
        </Suspense>
      </main>
    </div>
  );
}


