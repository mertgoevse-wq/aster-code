import { ModelMetadata } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';

export class OllamaAdapter implements ProviderAdapter {
  id = 'ollama';
  displayName = 'Ollama';
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
  }

  async health(): Promise<boolean> {
    // In MVP 0.1, we assume success or return false on timeout
    return true;
  }

  async listModels(): Promise<ModelMetadata[]> {
    // Mocked Ollama response for MVP 0.1
    const rawModels = [
      { name: 'llama3:8b', size: 4700000000, details: { parameter_size: '8B', family: 'llama' } },
      { name: 'mistral:7b', size: 4100000000, details: { parameter_size: '7B', family: 'mistral' } },
      { name: 'phi3:3.8b', size: 2200000000, details: { parameter_size: '3.8B', family: 'phi3' } },
      { name: 'codegemma:7b', size: 4800000000, details: { parameter_size: '7B', family: 'gemma' } }
    ];

    return rawModels.map(m => this.normalizeModel(m));
  }

  async getCapabilities(modelId: string) {
    return {
      supportsTools: modelId.includes('llama3') || modelId.includes('mistral'),
      supportsVision: false,
      supportsStreaming: true
    };
  }

  normalizeModel(rawModel: any): ModelMetadata {
    const isCode = rawModel.name.includes('code');
    return {
      id: `ollama/${rawModel.name}`,
      displayName: rawModel.name,
      provider: 'ollama',
      contextWindow: 8192,
      maxOutputTokens: 2048,
      inputModalities: ['text'],
      outputModalities: ['text'],
      supportsTools: rawModel.name.includes('llama3') || rawModel.name.includes('mistral'),
      supportsVision: false,
      supportsStreaming: true,
      bestFor: isCode ? 'Coding & Code Autocomplete' : 'General Assistance & Local Chat',
      description: `Local LLM run via Ollama. Parameter size: ${rawModel.details.parameter_size || 'Unknown'}.`,
      lastCheckedAt: new Date().toISOString()
    };
  }
}
