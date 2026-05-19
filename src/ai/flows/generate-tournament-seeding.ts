'use server';
/**
 * @fileOverview A Genkit flow for the Smart Seeding Assistant. It takes historical player and team
 * performance data and generates optimal tournament seedings.
 *
 * - generateTournamentSeeding - A function that handles the tournament seeding generation process.
 * - GenerateTournamentSeedingInput - The input type for the generateTournamentSeeding function.
 * - GenerateTournamentSeedingOutput - The return type for the generateTournamentSeeding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTournamentSeedingInputSchema = z.object({
  tournamentName: z.string().describe('The name of the tournament.'),
  participants: z
    .array(
      z.object({
        name: z.string().describe('The name of the player or team.'),
        type: z.enum(['player', 'team']).describe('The type of participant.'),
        historicalPerformance: z
          .string()
          .describe(
            'A detailed description of the participant\'s historical performance, including past scores, rankings, win/loss records, and any relevant statistics. This can be a JSON string or a descriptive text.'
          ),
      })
    )
    .describe('An array of participants with their historical performance data.'),
});
export type GenerateTournamentSeedingInput = z.infer<
  typeof GenerateTournamentSeedingInputSchema
>;

const GenerateTournamentSeedingOutputSchema = z.object({
  seeding: z
    .array(
      z.object({
        participantName: z.string().describe('The name of the player or team.'),
        seed: z
          .number()
          .int()
          .min(1)
          .describe('The suggested seed for the participant, starting from 1.'),
        reasoning: z
          .string()
          .describe(
            'A brief explanation of why this participant received this seed, based on their historical performance.'
          ),
      })
    )
    .describe('An ordered list of participants with their suggested seedings.'),
});
export type GenerateTournamentSeedingOutput = z.infer<
  typeof GenerateTournamentSeedingOutputSchema
>;

export async function generateTournamentSeeding(
  input: GenerateTournamentSeedingInput
): Promise<GenerateTournamentSeedingOutput> {
  return generateTournamentSeedingFlow(input);
}

const seedingPrompt = ai.definePrompt({
  name: 'generateTournamentSeedingPrompt',
  input: {schema: GenerateTournamentSeedingInputSchema},
  output: {schema: GenerateTournamentSeedingOutputSchema},
  prompt: `You are a Smart Seeding Assistant for multi-sport tournaments. Your goal is to analyze historical player and team performance data and suggest optimal tournament seedings to create fair and competitive brackets.\n\nTournament Name: {{{tournamentName}}}\n\nHere is the historical performance data for the participants:\n{{#each participants}}\nParticipant Name: {{{this.name}}}\nParticipant Type: {{{this.type}}}\nHistorical Performance: {{{this.historicalPerformance}}}\n---\n{{/each}}\n\nBased on the provided data, generate a seeding for the tournament. Assign lower seed numbers (e.g., 1 is the best) to stronger participants. Provide a brief reasoning for each seed assignment. Ensure the output is a JSON array of objects as defined in the output schema.`,
});

const generateTournamentSeedingFlow = ai.defineFlow(
  {
    name: 'generateTournamentSeedingFlow',
    inputSchema: GenerateTournamentSeedingInputSchema,
    outputSchema: GenerateTournamentSeedingOutputSchema,
  },
  async input => {
    const {output} = await seedingPrompt(input);
    return output!;
  }
);
