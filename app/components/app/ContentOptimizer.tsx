"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateSeoContent } from "@/app/actions";
import { Button } from "../../components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

const formSchema = z.object({
  currentContent: z.string().min(10, "Current content is too short."),
  keywords: z.string().min(3, "Please provide some keywords."),
  topic: z.string().min(3, "Please provide a topic."),
  optimizationMetrics: z.string().optional(),
});

type ContentOptimizerProps = {
  analysisSummary: string;
};

export function ContentOptimizer({ analysisSummary }: ContentOptimizerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [optimizedContent, setOptimizedContent] = useState<{ seoOptimizedContent: string; suggestedTitle: string; metaDescription: string; } | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentContent: analysisSummary,
      keywords: "",
      topic: "",
      optimizationMetrics: "N/A",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setOptimizedContent(null);
    try {
      const result = await generateSeoContent(values);
      setOptimizedContent(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Generating Content",
        description: "There was a problem generating content. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Content Optimizer
        </CardTitle>
        <CardDescription>
          Generate SEO-ready content based on your existing page data and target keywords.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., E-commerce Product Page" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., handmade leather boots, buy online" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="currentContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Content / Page Analysis</FormLabel>
                  <FormControl>
                    <Textarea rows={8} placeholder="Enter or paste your current page content here." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate SEO Content
            </Button>
          </form>
        </Form>

        {optimizedContent && (
          <div className="mt-8 space-y-6 pt-8 border-t">
            <h3 className="text-2xl font-bold font-headline">AI Suggestions</h3>
            <div className="space-y-4">
              <h4 className="font-semibold">Suggested Title</h4>
              <p className="p-4 bg-muted rounded-md">{optimizedContent.suggestedTitle}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Suggested Meta Description</h4>
              <p className="p-4 bg-muted rounded-md">{optimizedContent.metaDescription}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Optimized Content</h4>
              <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">{optimizedContent.seoOptimizedContent}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
