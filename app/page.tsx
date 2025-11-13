import Image from 'next/image';
import { Header } from './components/app/Header';
import { UrlInputForm } from './components/app/UrlInputForm';
import { PlaceHolderImages } from './lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { CheckCircle2, Search, Zap, ScanLine, BarChart, Wrench } from 'lucide-react';
import { Button } from './components/ui/button';
import Link from 'next/link';
import { Logo } from './lib/icons';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './components/ui/accordion';


const features = [
  { 
    title: "In-Depth SEO Analysis",
    description: "Get a comprehensive report on your site's SEO health, identifying opportunities for improvement.",
    icon: Search,
  },
  { 
    title: "Performance & Accessibility",
    description: "Audit your site for critical performance and accessibility issues that affect user experience.",
    icon: Zap,
  },
  { 
    title: "Automated Fixes",
    description: "Leverage AI to generate code snippets and content suggestions to resolve identified problems.",
    icon: Wrench,
  },
];

const howItWorks = [
  {
    title: "1. Enter URL",
    description: "Provide the URL of the website you want to analyze.",
    icon: ScanLine,
  },
  {
    title: "2. Get Instant Analysis",
    description: "Our AI performs a deep analysis and generates a detailed report in seconds.",
    icon: BarChart,
  },
  {
    title: "3. Implement & Optimize",
    description: "Use AI-generated content, fixes, and video summaries to improve your site.",
    icon: CheckCircle2,
  },
];

const testimonials = [
  {
    quote: "DeepView AI transformed our web strategy. The insights were invaluable and the AI-generated fixes saved us countless hours.",
    name: "Jane Doe",
    title: "CEO, Tech Solutions",
    avatarId: "avatar1",
  },
  {
    quote: "The most comprehensive analysis tool I've ever used. The UI/UX suggestions helped us increase our conversion rate by 20%.",
    name: "John Smith",
    title: "Marketing Director, Innovate Co.",
    avatarId: "avatar2",
  },
  {
    quote: "A must-have for any developer or marketer. The automated content and video summaries are game-changers.",
    name: "Emily White",
    title: "Freelance Developer",
    avatarId: "avatar3",
  },
]

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative w-full pt-24 pb-12 md:pt-28 md:pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover object-center -z-10"
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background -z-10" />
          <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)] bg-[radial-gradient(60%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                New: AI-generated fixes and video summaries
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl font-headline">
                Elevate your site with{" "}
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  AI‑powered analysis
                </span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
                DeepView AI audits performance, accessibility, SEO, and UX—then generates actionable fixes, improved content, and concise video explanations.
              </p>
              <div className="mt-6 w-full max-w-xl mx-auto">
                <UrlInputForm />
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button asChild size="sm">
                  <Link href="#features">Explore features</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="#how-it-works">How it works</Link>
                </Button>
              </div>
            </div>
            <div className="mt-10 flex w-full flex-wrap items-center justify-center gap-6 opacity-80">
              <Image src="/vercel.svg" alt="Vercel" width={80} height={20} className="h-5 w-auto mx-auto" />
              <Image src="/next.svg" alt="Next.js" width={80} height={20} className="h-5 w-auto mx-auto" />
              <Image src="/globe.svg" alt="Web" width={80} height={20} className="h-5 w-auto mx-auto" />
              <Image src="/window.svg" alt="Browser" width={80} height={20} className="h-5 w-auto mx-auto" />
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-primary font-semibold">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  DeepView AI provides a full suite of tools to enhance your website's performance, user experience, and search engine ranking.
                </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.title} className="bg-card/60 transition-all hover:bg-card hover:shadow-xl hover:-translate-y-1 duration-300 border border-border/40 hover:border-primary/40 flex flex-col">
                    <CardHeader className="flex flex-col items-center text-center">
                      <div className="bg-primary/10 p-4 rounded-full mb-4 ring-1 ring-inset ring-primary/20">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-primary font-semibold">How It Works</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Simple Three-Step Process</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Getting started with DeepView AI is quick and easy. Follow these simple steps to begin optimizing your website.
                </p>
            </div>
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {howItWorks.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex flex-col items-center text-center gap-4 p-6 bg-background">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border-8 border-background mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-primary font-semibold">Testimonials</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">What Our Users Say</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Hear from satisfied customers who have transformed their web presence with DeepView AI.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => {
                const avatarImage = PlaceHolderImages.find(p => p.id === testimonial.avatarId);
                return (
                  <Card key={testimonial.name} className="bg-card/80 border-border/40 hover:border-primary/30 transition-colors flex flex-col">
                    <CardContent className="p-6 flex-1">
                      <p className="text-muted-foreground">"{testimonial.quote}"</p>
                    </CardContent>
                    <CardHeader className="flex flex-row items-center gap-4 pt-0">
                      {avatarImage && (
                        <Avatar>
                          <AvatarImage src={avatarImage.imageUrl} alt={avatarImage.description} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section id="faq" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-primary font-semibold">FAQ</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Common Questions</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Quick answers about analysis depth, data usage, and AI-generated outputs.
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>What does the analysis include?</AccordionTrigger>
                  <AccordionContent>
                    Performance, accessibility, SEO, and UX heuristics. We render pages in a headless browser to capture real metrics and surface prioritized issues.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Do you store my website data?</AccordionTrigger>
                  <AccordionContent>
                    We only process data for generating the report and discard it after completion. You can export insights and fixes at any time.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How accurate are AI-generated fixes?</AccordionTrigger>
                  <AccordionContent>
                    Fixes are context‑aware starting points. They include code and content suggestions that you can review and apply with minimal edits.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold">DeepView AI</span>
        </Link>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Features
          </Link>
          <Link href="#testimonials" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Testimonials
          </Link>
          <Link href="#how-it-works" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            How It Works
          </Link>
        </nav>
      </footer>
    </div>
  );
}
