import { GeminiProvider } from './gemini';
import type { AIProvider } from './types';
import { env } from '$env/dynamic/public';

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
    if (!providerInstance) {
        // In a real app, you might load this from settings or env
        // For now, default to Gemini
        const apiKey = env.PUBLIC_GEMINI_API_KEY || '';
        if (!apiKey) {
            console.warn('Gemini API Key is missing. AI features will not work.');
        }
        providerInstance = new GeminiProvider(apiKey);
    }
    return providerInstance;
}

export function setAIProvider(provider: AIProvider) {
    providerInstance = provider;
}
