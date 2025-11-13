"use client";

import { useState } from "react";
import { generateVideo } from "@/app/actions";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Video, Loader2, Wand2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

type VideoGeneratorProps = {
  analysisSummary: string;
};

export function VideoGenerator({ analysisSummary }: VideoGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateVideo = async () => {
    setIsLoading(true);
    setVideoUri(null);
    try {
      const result = await generateVideo({ websiteAnalysisSummary: analysisSummary });
      setVideoUri(result.videoDataUri);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Generating Video",
        description: "There was a problem generating the video. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          AI Video Explanation
        </CardTitle>
        <CardDescription>
          Generate a short video summarizing the analysis, issues, and suggested fixes for your website.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-8">
        {!videoUri && !isLoading && (
          <div className="flex flex-col items-center space-y-4">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
              <Video className="h-16 w-16 text-muted-foreground" />
            </div>
            <Button onClick={handleGenerateVideo} disabled={isLoading}>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Video
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating your video explanation... <br/> This may take a minute or two.</p>
          </div>
        )}

        {videoUri && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              controls
              src={videoUri}
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
