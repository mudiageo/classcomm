import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider, MessageParams } from './types';

export class GeminiProvider implements AIProvider {
    private model;

    constructor(apiKey: string) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    }

    async generateMessage(params: MessageParams): Promise<{ subject: string; body: string }> {
        const systemPrompt = `You are an expert educational communication assistant helping teachers draft professional, empathetic messages to parents and guardians.

Guidelines:
1. Be specific about the issue or update
2. Start with something positive when possible
3. Use "I" statements (I've noticed, I'm concerned)
4. Offer concrete next steps or solutions
5. Invite collaboration
6. Keep it concise (150-250 words for emails)
7. End with appreciation for partnership
8. Avoid educational jargon
9. Be culturally sensitive
10. Maintain professional boundaries`;

        const userPrompt = `Generate a ${params.method} to ${params.contactName} regarding ${params.studentName} (Grade ${params.grade}) with the following situation:

${params.scenario}

${params.additionalContext ? `Additional context: ${params.additionalContext}` : ''}

Tone: ${params.tone}

Provide:
1. Subject line (if email)
2. Message body

Format your response as JSON:
{
  "subject": "...",
  "body": "..."
}`;

        const result = await this.model.generateContent([
            { text: systemPrompt },
            { text: userPrompt }
        ]);

        const response = result.response;
        const text = response.text();

        // Parse JSON from text (Gemini might return markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not parse message from response');
        }

        return JSON.parse(jsonMatch[0]);
    }
}
