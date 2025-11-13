'use server';

/**
 * @fileOverview A video explanation generator for website analysis results.
 *
 * - generateVideoExplanation - A function that generates a video explanation summarizing website issues and fixes.
 * - GenerateVideoExplanationInput - The input type for the generateVideoExplanation function.
 * - GenerateVideoExplanationOutput - The return type for the generateVideoExplanation function.
 */

import {ai} from '../../ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GenerateVideoExplanationInputSchema = z.object({
  websiteAnalysisSummary: z
    .string()
    .describe(
      'A summary of the website analysis results, including identified issues and proposed fixes.'
    ),
});
export type GenerateVideoExplanationInput = z.infer<
  typeof GenerateVideoExplanationInputSchema
>;

const GenerateVideoExplanationOutputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      'A data URI containing the video explanation in MP4 format, summarizing the identified issues and proposed fixes.'
    ),
});
export type GenerateVideoExplanationOutput = z.infer<
  typeof GenerateVideoExplanationOutputSchema
>;

export async function generateVideoExplanation(
  input: GenerateVideoExplanationInput
): Promise<GenerateVideoExplanationOutput> {
  return generateVideoExplanationFlow(input);
}

const generateVideoExplanationPrompt = ai.definePrompt({
  name: 'generateVideoExplanationPrompt',
  input: {schema: GenerateVideoExplanationInputSchema},
  prompt: `You are an AI video creator that will use the text below to generate a video explanation of website issues and fixes.

Website Analysis Summary: {{{websiteAnalysisSummary}}}

Create a script for the video explanation based on the above summary. The script should be concise and easy to understand. Assume there will be a voice over artist performing the script and that the script will be used for video generation.

Use the script to then create a video explaining the issues and fixes.`,
});

const generateVideoExplanationFlow = ai.defineFlow(
  {
    name: 'generateVideoExplanationFlow',
    inputSchema: GenerateVideoExplanationInputSchema,
    outputSchema: GenerateVideoExplanationOutputSchema,
  },
  async input => {
    // Generate TTS audio
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: input.websiteAnalysisSummary,
    });

    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const audioDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    // Generate video from image
    let {operation} = await ai.generate({
      model: 'veo-2.0-generate-001',
      prompt: [
        {
          text: `Create a video explanation summarizing the website issues and fixes, narrated by a voiceover.`,
        },
      ],
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }

    return {
      videoDataUri: video.media?.url ?? '',
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
