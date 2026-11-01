import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name);
    private readonly client: GoogleGenAI | null;
    private lastUsage: { tokensIn: number; tokensOut: number } = {
        tokensIn: 0,
        tokensOut: 0,
    };

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('ai.apiKey');
        this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;

        if (!this.client) {
            this.logger.warn(
                'Gemini is not configured. AI chat will use the rules fallback.',
            );
        }
    }

    /**
     * Returns whether the Gemini client is configured.
     *
     * @returns True when GEMINI_API_KEY is set
     */
    isConfigured(): boolean {
        return Boolean(this.client);
    }

    /**
     * Returns the usage metadata of the last Gemini call.
     *
     * @returns Input and output token counts
     */
    getLastUsage(): { tokensIn: number; tokensOut: number } {
        return this.lastUsage;
    }

    /**
     * Generates a structured JSON response.
     *
     * @param prompt - Prompt sent to Gemini
     * @param model - Model name
     * @returns Parsed JSON or null when unavailable
     */
    async generateJson(prompt: string, model?: string): Promise<any | null> {
        if (!this.client) {
            return null;
        }

        try {
            const response = await this.client.models.generateContent({
                model: model ?? this.configService.get<string>('ai.chatModel'),
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 500,
                },
            });
            const usage = response.usageMetadata;
            this.lastUsage = {
                tokensIn: usage?.promptTokenCount ?? 0,
                tokensOut: usage?.candidatesTokenCount ?? 0,
            };

            return JSON.parse(response.text ?? '{}');
        } catch (error) {
            this.logger.error(
                `Gemini JSON generation failed: ${error instanceof Error ? error.message : error}`,
            );
            return null;
        }
    }

    /**
     * Streams a plain text response from Gemini.
     *
     * @param prompt - Prompt sent to Gemini
     * @param model - Model name
     * @yields Text chunks
     */
    async *generateTextStream(
        prompt: string,
        model?: string,
    ): AsyncGenerator<string> {
        if (!this.client) {
            return;
        }

        try {
            const stream = await this.client.models.generateContentStream({
                model: model ?? this.configService.get<string>('ai.chatModel'),
                contents: prompt,
                config: {
                    maxOutputTokens: 500,
                },
            });

            for await (const chunk of stream) {
                const text = chunk.text;
                if (text) {
                    yield text;
                }
            }
        } catch (error) {
            this.logger.error(
                `Gemini stream failed: ${error instanceof Error ? error.message : error}`,
            );
        }
    }

    /**
     * Analyzes a Cloudinary image with Gemini vision.
     *
     * @param imageUrl - Public image URL
     * @param prompt - Vision prompt
     * @returns The model answer or null when unavailable
     */
    async analyzePhoto(
        imageUrl: string,
        prompt: string,
    ): Promise<string | null> {
        if (!this.client) {
            return null;
        }

        try {
            const imageResponse = await fetch(imageUrl);
            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            const mimeType =
                imageResponse.headers.get('content-type') ?? 'image/jpeg';
            const response = await this.client.models.generateContent({
                model:
                    this.configService.get<string>('ai.visionModel') ??
                    'gemini-2.5-flash',
                contents: [
                    {
                        inlineData: {
                            mimeType,
                            data: buffer.toString('base64'),
                        },
                    },
                    { text: prompt },
                ],
                config: {
                    maxOutputTokens: 300,
                },
            });

            return response.text ?? null;
        } catch (error) {
            this.logger.error(
                `Gemini vision failed: ${error instanceof Error ? error.message : error}`,
            );
            return null;
        }
    }
}
