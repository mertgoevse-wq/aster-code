import { ModelMetadata } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';

export class OpenRouterAdapter implements ProviderAdapter {
  id = 'openrouter';
  displayName = 'OpenRouter';
  private baseUrl: string;
  private apiKey?: string;

  constructor(apiKey?: string, baseUrl = 'https://openrouter.ai/api/v1') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
        'HTTP-Referer': 'https://github.com/google/aster-code',
        'X-Title': 'Aster Code Studio',
        ...(options.headers || {})
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  async health(): Promise<boolean> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/models`);
      return res.status === 200;
    } catch (e) {
      return false;
    }
  }

  async listModels(): Promise<ModelMetadata[]> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/models`);
      if (!res.ok) {
        throw new Error(`OpenRouter returned status ${res.status}`);
      }
      const data = await res.json();
      if (!data || !Array.isArray(data.data)) {
        return [];
      }
      
      // Let's filter or slice the models to the top 20 popular models to keep list sizes clean
      // and easy to search, or return all. Let's return the models list.
      const rawModels = data.data;
      return rawModels.map((m: any) => this.normalizeModel(m));
    } catch (err) {
      console.warn('[OpenRouter] Failed to list models:', err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getCapabilities(modelId: string) {
    const idLower = modelId.toLowerCase();
    return {
      supportsTools: idLower.includes('claude-3') || idLower.includes('gpt-4') || idLower.includes('llama-3') || idLower.includes('gemini'),
      supportsVision: idLower.includes('vision') || idLower.includes('gpt-4o') || idLower.includes('claude-3-5-sonnet') || idLower.includes('gemini-1.5'),
      supportsStreaming: true
    };
  }

  normalizeModel(rawModel: any): ModelMetadata {
    const rawId = rawModel.id || 'unknown';
    const name = rawModel.name || rawId;
    const isCode = rawId.includes('code') || rawId.includes('coder') || rawId.includes('deepseek') || rawId.includes('instruct');
    const isVision = rawId.includes('vision') || rawId.includes('gpt-4o') || rawId.includes('claude-3.5-sonnet') || rawId.includes('gemini-1.5-pro') || rawId.includes('gemini-1.5-flash');

    return {
      id: `openrouter/${rawId}`,
      displayName: name,
      provider: 'openrouter',
      contextWindow: rawModel.context_length || 8192,
      maxOutputTokens: rawModel.top_provider?.max_completion_tokens || 4096,
      inputModalities: isVision ? ['text', 'image'] : ['text'],
      outputModalities: ['text'],
      supportsTools: rawId.includes('claude-3') || rawId.includes('gpt-4') || rawId.includes('llama-3') || rawId.includes('gemini'),
      supportsVision: isVision,
      supportsStreaming: true,
      bestFor: isCode ? 'Technical Coding & Logical Reasoning' : 'Agent Conversations & Planning',
      description: rawModel.description || `OpenRouter model integration: ${rawId}.`,
      lastCheckedAt: new Date().toISOString(),
      raw: rawModel
    };
  }
}
