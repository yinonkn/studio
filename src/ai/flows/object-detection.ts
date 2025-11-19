'use server';

/**
 * @fileOverview A flow to detect objects in an image.
 *
 * - detectObjectsInImage - A function that detects objects in an image.
 * - DetectObjectsInput - The input type for the detectObjectsInImage function.
 * - DetectObjectsOutput - The return type for the detectObjectsInImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectObjectsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of a scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

const DetectedObjectSchema = z.object({
    label: z.string().describe('The label of the detected object (e.g., "drinking glass").'),
    box: z.array(z.number()).length(4).describe('The bounding box of the detected object as [x_min, y_min, x_max, y_max] normalized coordinates.'),
});

const DetectObjectsOutputSchema = z.object({
  objects: z.array(DetectedObjectSchema).describe('A list of detected objects.'),
});
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

export async function detectObjectsInImage(
  input: DetectObjectsInput
): Promise<DetectObjectsOutput> {
  return objectDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'objectDetectionPrompt',
  input: {schema: DetectObjectsInputSchema},
  output: {schema: DetectObjectsOutputSchema},
  prompt: `You are an expert object detection model. Your task is to identify and locate "drinking glass" in the provided image.

For each drinking glass you find, provide its label and a precise bounding box.
The bounding box should be in normalized coordinates [x_min, y_min, x_max, y_max], where (0,0) is the top-left corner and (1,1) is the bottom-right corner.

Image: {{media url=imageDataUri}}

If you do not find any drinking glasses, you must return an empty list of objects.
`,
});

const objectDetectionFlow = ai.defineFlow(
  {
    name: 'objectDetectionFlow',
    inputSchema: DetectObjectsInputSchema,
    outputSchema: DetectObjectsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
