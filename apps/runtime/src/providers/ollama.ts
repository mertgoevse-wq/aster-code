import { ModelMetadata } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';

export class OllamaAdapter implements ProviderAdapter {
  id = 'ollama';
  displayName = 'Ollama';
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 2500): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
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
      const res = await this.fetchWithTimeout(this.baseUrl);
      return res.status === 200;
    } catch (e) {
      return false;
    }
  }

  async listModels(): Promise<ModelMetadata[]> {
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        throw new Error(`Ollama returned status ${res.status}`);
      }
      const data = await res.json();
      if (!data || !Array.isArray(data.models)) {
        return [];
      }
      return data.models.map((m: any) => this.normalizeModel(m));
    } catch (err) {
      console.warn(`[Ollama] Failed to list models from ${this.baseUrl}:`, err instanceof Error ? err.message : err);
      return [];
    }
  }

  async getCapabilities(modelId: string) {
    const idLower = modelId.toLowerCase();
    return {
      supportsTools: idLower.includes('llama3') || idLower.includes('mistral') || idLower.includes('command-r'),
      supportsVision: idLower.includes('llava') || idLower.includes('bakllava') || idLower.includes('vision'),
      supportsStreaming: true
    };
  }

  normalizeModel(rawModel: any): ModelMetadata {
    const name = rawModel.name || 'unknown';
    const isCode = name.includes('code') || name.includes('coder') || name.includes('deepseek');
    const paramSize = rawModel.details?.parameter_size || 'Unknown';
    const quantization = rawModel.details?.quantization_level || 'Unknown';

    return {
      id: `ollama/${name}`,
      displayName: name,
      provider: 'ollama',
      contextWindow: isCode ? 16384 : 8192,
      maxOutputTokens: 4096,
      inputModalities: name.includes('llava') ? ['text', 'image'] : ['text'],
      outputModalities: ['text'],
      supportsTools: name.includes('llama3') || name.includes('mistral') || name.includes('command-r'),
      supportsVision: name.includes('llava') || name.includes('bakllava') || name.includes('vision'),
      supportsStreaming: true,
      bestFor: isCode ? 'Local Coding & Code Autocomplete' : 'Local Chat & Reasoning',
      description: `Local model run via Ollama. Param Size: ${paramSize}, Quantization: ${quantization}. Size: ${(rawModel.size / (1024 * 1024 * 1024)).toFixed(2)} GB.`,
      lastCheckedAt: new Date().toISOString(),
      raw: rawModel
    };
  }
}
