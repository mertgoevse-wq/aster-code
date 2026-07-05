import { ModelMetadata } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';

export class OpenAICompatibleAdapter implements ProviderAdapter {
  id: string;
  displayName: string;
  private baseUrl: string;

  constructor(id: string, displayName: string, baseUrl: string) {
    this.id = id;
    this.displayName = displayName;
    this.baseUrl = baseUrl;
  }

  async health(): Promise<boolean> {
    return true;
  }

  async listModels(): Promise<ModelMetadata[]> {
    // Generate mocked lists depending on adapter configuration
    if (this.id === 'lmstudio') {
      return [
        {
          id: 'lmstudio/qwen2.5-coder-7b',
          displayName: 'qwen2.5-coder-7b-instruct',
          provider: 'lmstudio',
          contextWindow: 32768,
          maxOutputTokens: 4096,
          inputModalities: ['text'],
          outputModalities: ['text'],
          supportsTools: true,
          supportsVision: false,
          supportsStreaming: true,
          bestFor: 'Local Coding & Reasoning',
          description: 'Qwen 2.5 Coder instruction model served via LM Studio.',
          lastCheckedAt: new Date().toISOString()
        },
        {
          id: 'lmstudio/hermes-3-llama-3.1-8b',
          displayName: 'hermes-3-llama-3.1-8b',
          provider: 'lmstudio',
          contextWindow: 16384,
          maxOutputTokens: 2048,
          inputModalities: ['text'],
          outputModalities: ['text'],
          supportsTools: true,
          supportsVision: false,
          supportsStreaming: true,
          bestFor: 'Creative Agent Workflows',
          description: 'Hermes 3 fine-tune of Llama 3.1 served via LM Studio.',
          lastCheckedAt: new Date().toISOString()
        }
      ];
    }

    if (this.id === 'openrouter') {
      return [
        {
          id: 'openrouter/anthropic/claude-3.5-sonnet',
          displayName: 'Anthropic: Claude 3.5 Sonnet',
          provider: 'openrouter',
          contextWindow: 200000,
          maxOutputTokens: 8192,
          inputModalities: ['text', 'image'],
          outputModalities: ['text'],
          supportsTools: true,
          supportsVision: true,
          supportsStreaming: true,
          bestFor: 'Complex Coding, Agent Workflows',
          description: 'State of the art model from Anthropic via OpenRouter.',
          lastCheckedAt: new Date().toISOString()
        },
        {
          id: 'openrouter/meta/llama-3.1-405b',
          displayName: 'Meta: Llama 3.1 405B Instruct',
          provider: 'openrouter',
          contextWindow: 131072,
          maxOutputTokens: 4096,
          inputModalities: ['text'],
          outputModalities: ['text'],
          supportsTools: true,
          supportsVision: false,
          supportsStreaming: true,
          bestFor: 'Large-scale synthetic data or planning',
          description: 'Massive open weights model from Meta via OpenRouter.',
          lastCheckedAt: new Date().toISOString()
        }
      ];
    }

    if (this.id === 'nvidia') {
      return [
        {
          id: 'nvidia/meta/llama-3.1-70b-instruct',
          displayName: 'NVIDIA: Llama 3.1 70B Instruct',
          provider: 'nvidia',
          contextWindow: 128000,
          maxOutputTokens: 4096,
          inputModalities: ['text'],
          outputModalities: ['text'],
          supportsTools: true,
          supportsVision: false,
          supportsStreaming: true,
          bestFor: 'High throughput reasoning & structured output',
          description: 'Meta Llama 3.1 70B model optimized by NVIDIA API Catalog.',
          lastCheckedAt: new Date().toISOString()
        }
      ];
    }

    // Default Custom OpenAI compatible response
    return [
      {
        id: `${this.id}/custom-gpt-4o-mock`,
        displayName: 'Custom GPT-4o Mock',
        provider: this.id,
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text', 'image'],
        outputModalities: ['text'],
        supportsTools: true,
        supportsVision: true,
        supportsStreaming: true,
        bestFor: 'Generic API Testing',
        description: 'A custom OpenAI compatible endpoint mock model.',
        lastCheckedAt: new Date().toISOString()
      }
    ];
  }

  async getCapabilities(modelId: string) {
    return {
      supportsTools: true,
      supportsVision: modelId.includes('sonnet') || modelId.includes('gpt-4o'),
      supportsStreaming: true
    };
  }

  normalizeModel(rawModel: any): ModelMetadata {
    return {
      id: rawModel.id || `${this.id}/unknown`,
      displayName: rawModel.name || 'Unknown Model',
      provider: this.id,
      contextWindow: 8192,
      maxOutputTokens: 2048,
      inputModalities: ['text'],
      outputModalities: ['text'],
      supportsTools: true,
      supportsVision: false,
      supportsStreaming: true,
      bestFor: 'Coding & Analysis',
      description: 'Custom OpenAI-compatible model.',
      lastCheckedAt: new Date().toISOString()
    };
  }
}
