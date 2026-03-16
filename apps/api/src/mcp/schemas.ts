import { z } from 'zod';

export const ResponseFormatSchema = z.enum(['markdown', 'json']).default('markdown');

export const GenericToolResultSchema = z.object({
    data: z.any(),
});

export type ToolResponseFormat = z.infer<typeof ResponseFormatSchema>;
