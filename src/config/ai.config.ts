import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
    apiKey: process.env.GEMINI_API_KEY ?? '',
    chatModel: process.env.GEMINI_CHAT_MODEL ?? 'gemini-1.5-flash',
    visionModel: process.env.GEMINI_VISION_MODEL ?? 'gemini-1.5-flash',
    ttsModel: process.env.GEMINI_TTS_MODEL ?? 'gemini-1.5-flash',
    chatDailyQuota: Number.parseInt(
        process.env.AI_CHAT_DAILY_QUOTA ?? '40',
        10,
    ),
    photoDailyQuota: Number.parseInt(
        process.env.AI_PHOTO_DAILY_QUOTA ?? '3',
        10,
    ),
    inputCostPer1kUsd: Number.parseFloat(
        process.env.GEMINI_INPUT_COST_PER_1K_USD ?? '0.0001',
    ),
    outputCostPer1kUsd: Number.parseFloat(
        process.env.GEMINI_OUTPUT_COST_PER_1K_USD ?? '0.0004',
    ),
}));
