'use server';

/**
 * @fileOverview A flow to calculate the confidence score for the volume measurement.
 *
 * - calculateVolumeConfidenceScore - A function that calculates the confidence score.
 * - VolumeConfidenceScoreInput - The input type for the calculateVolumeConfidenceScore function.
 * - VolumeConfidenceScoreOutput - The return type for the calculateVolumeConfidenceScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VolumeConfidenceScoreInputSchema = z.object({
  glassShape: z.string().describe('The detected shape of the glass (e.g., cylinder, cone).'),
  waterLineConsistency: z
    .string()
    .describe(
      'A description of how consistent the water line is with the detected glass shape.'
    ),
  volumeEstimate: z.number().describe('The estimated volume of the liquid in the glass.'),
});
export type VolumeConfidenceScoreInput = z.infer<typeof VolumeConfidenceScoreInputSchema>;

const VolumeConfidenceScoreOutputSchema = z.object({
  confidenceScore: z
    .number()
    .describe(
      'A confidence score between 0 and 1 indicating the reliability of the volume measurement.'
    ),
  reasoning: z.string().describe('The reasoning behind the assigned confidence score.'),
});
export type VolumeConfidenceScoreOutput = z.infer<typeof VolumeConfidenceScoreOutputSchema>;

export async function calculateVolumeConfidenceScore(
  input: VolumeConfidenceScoreInput
): Promise<VolumeConfidenceScoreOutput> {
  return volumeConfidenceScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'volumeConfidenceScorePrompt',
  input: {schema: VolumeConfidenceScoreInputSchema},
  output: {schema: VolumeConfidenceScoreOutputSchema},
  prompt: `You are an expert in evaluating the confidence of volume measurements in drinking glasses.

You will receive information about the detected glass shape, the consistency of the water line, and the estimated volume.
Based on this information, you will assign a confidence score between 0 and 1 (inclusive) for the volume measurement.
Also explain your reasoning for the provided score.

Glass Shape: {{{glassShape}}}
Water Line Consistency: {{{waterLineConsistency}}}
Volume Estimate: {{{volumeEstimate}}} ml

Consider these factors:
- How well does the water line align with the expected behavior for the given glass shape?
- Are there any inconsistencies or anomalies that would suggest the measurement is unreliable?
- Is the volume estimate realistic given the shape and water line?

Output a JSON object with the confidenceScore and reasoning fields.
`,
});

const volumeConfidenceScoreFlow = ai.defineFlow(
  {
    name: 'volumeConfidenceScoreFlow',
    inputSchema: VolumeConfidenceScoreInputSchema,
    outputSchema: VolumeConfidenceScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
