import { ModelMetadata } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  id: string;
  displayName: string;
  private baseUrl: string;
  private apiKey?: string;

  constructor(id: string, displayName: string, baseUrl: string, apiKey?: string) {
    this.id = id;
    this.displayName = displayName;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  protected async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
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
        throw new Error(`Endpoint returned status ${res.status}`);
      }
      const data = await res.json();
      if (!data || !Array.isArray(data.data)) {
        return [];
      }
      return data.data.map((m: any) => this.normalizeModel(m));
    } catch (err) {
      console.warn(`[${this.displayName}] Failed to list models from ${this.baseUrl}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getCapabilities(modelId: string) {
    const idLower = modelId.toLowerCase();
    return {
      supportsTools: idLower.includes('gpt-4') || idLower.includes('claude') || idLower.includes('llama-3') || idLower.includes('gemini'),
      supportsVision: idLower.includes('vision') || idLower.includes('gpt-4o') || idLower.includes('claude-3-5-sonnet'),
      supportsStreaming: true
    };
  }

  normalizeModel(rawModel: any): ModelMetadata {
    const name = rawModel.id || 'unknown';
    const isCode = name.includes('code') || name.includes('coder') || name.includes('deepseek');
    const isVision = name.includes('vision') || name.includes('gpt-4o') || name.includes('claude-3-5-sonnet');
    
    return {
      id: `${this.id}/${name}`,
      displayName: name,
      provider: this.id,
      contextWindow: name.includes('gpt-4') || name.includes('claude') ? 128000 : 8192,
      maxOutputTokens: 4096,
      inputModalities: isVision ? ['text', 'image'] : ['text'],
      outputModalities: ['text'],
      supportsTools: name.includes('gpt-4') || name.includes('claude') || name.includes('llama-3') || name.includes('gemini'),
      supportsVision: isVision,
      supportsStreaming: true,
      bestFor: isCode ? 'Coding & Technical Tasks' : 'General Instruction & Dialogue',
      description: `Model served via OpenAI-Compatible endpoint. Object ID: ${rawModel.id}. Owned by: ${rawModel.owned_by || 'Unknown'}.`,
      lastCheckedAt: new Date().toISOString(),
      raw: rawModel
    };
  }
}
