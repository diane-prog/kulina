import { z } from 'zod';

export const AiResponseSchema = z.object({
    answer: z.string().min(1),
    action: z
        .enum(['none', 'adjust_timer', 'go_next_step', 'repeat_step'])
        .default('none'),
    newTimerSeconds: z.number().int().nonnegative().nullable().optional(),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;
