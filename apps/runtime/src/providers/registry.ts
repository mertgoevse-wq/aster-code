import { ModelMetadata, ProviderInfo, ProviderId } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';
import { OllamaAdapter } from './ollama.js';
import { OpenAICompatibleAdapter } from './openaiCompatible.js';

export class ModelRegistry {
  private adapters: Map<ProviderId, ProviderAdapter> = new Map();
  private modelCache: ModelMetadata[] = [];
  private lastRefreshTime: string | null = null;
  private isRefreshing = false;
  private refreshInterval: NodeJS.Timeout | null = null;

  // Configuration settings (with defaults)
  private config = {
    autoRefreshEnabled: true,
    autoRefreshIntervalMs: 5 * 60 * 1000, // 5 minutes
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234/v1',
    openaiCompatibleUrl: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    openrouterApiKey: '',
    nvidiaApiKey: ''
  };

  constructor() {
    this.initializeAdapters();
    if (this.config.autoRefreshEnabled) {
      this.startBackgroundRefresh();
    }
  }

  updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeAdapters();

    // Restart timer if parameters changed
    this.stopBackgroundRefresh();
    if (this.config.autoRefreshEnabled) {
      this.startBackgroundRefresh();
    }
  }

  private initializeAdapters() {
    this.adapters.clear();

    // 1. Ollama
    this.adapters.set('ollama', new OllamaAdapter(this.config.ollamaUrl));

    // 2. LM Studio
    this.adapters.set('lmstudio', new OpenAICompatibleAdapter('lmstudio', 'LM Studio', this.config.lmstudioUrl));

    // 3. OpenRouter
    this.adapters.set('openrouter', new OpenAICompatibleAdapter('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1'));

    // 4. NVIDIA
    this.adapters.set('nvidia', new OpenAICompatibleAdapter('nvidia', 'NVIDIA API', 'https://integrate.api.nvidia.com/v1'));

    // 5. OpenAI Compatible (Custom)
    if (this.config.openaiCompatibleUrl) {
      this.adapters.set(
        'openai-compatible',
        new OpenAICompatibleAdapter('openai-compatible', 'Custom LLM', this.config.openaiCompatibleUrl)
      );
    }
  }

  getProviders(): ProviderInfo[] {
    const list: ProviderId[] = ['openai', 'anthropic', 'openrouter', 'ollama', 'lmstudio', 'openai-compatible', 'nvidia'];
    return list.map(id => {
      const adapter = this.adapters.get(id);
      let configured = false;
      let enabled = true;
      let baseUrl = '';

      switch (id) {
        case 'openai':
          configured = !!this.config.openaiApiKey;
          break;
        case 'anthropic':
          configured = !!this.config.anthropicApiKey;
          break;
        case 'openrouter':
          configured = !!this.config.openrouterApiKey;
          break;
        case 'nvidia':
          configured = !!this.config.nvidiaApiKey;
          break;
        case 'ollama':
          configured = true;
          baseUrl = this.config.ollamaUrl;
          break;
        case 'lmstudio':
          configured = true;
          baseUrl = this.config.lmstudioUrl;
          break;
        case 'openai-compatible':
          configured = !!this.config.openaiCompatibleUrl;
          baseUrl = this.config.openaiCompatibleUrl;
          break;
      }

      return {
        id,
        displayName: adapter?.displayName || id.toUpperCase(),
        enabled,
        configured,
        baseUrl: baseUrl || undefined
      };
    });
  }

  async refreshModels(): Promise<{ models: ModelMetadata[]; lastRefreshAt: string }> {
    if (this.isRefreshing) {
      return { models: this.modelCache, lastRefreshAt: this.lastRefreshTime || new Date().toISOString() };
    }

    this.isRefreshing = true;
    const aggregatedModels: ModelMetadata[] = [];

    // Let's also prepend standard Anthropic and OpenAI models as placeholders/static items
    // since the prompt says "GET /models and models refresh returns mocked data first, no real provider API calls yet"
    const staticCloudModels: ModelMetadata[] = [
      {
        id: 'anthropic/claude-3-5-sonnet-latest',
        displayName: 'Claude 3.5 Sonnet (Latest)',
        provider: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        inputModalities: ['text', 'image'],
        outputModalities: ['text'],
        supportsTools: true,
        supportsVision: true,
        supportsStreaming: true,
        bestFor: 'Coding, Reasoning, UI Building',
        description: 'Anthropic\'s most powerful model, excels at complex logical steps.',
        lastCheckedAt: new Date().toISOString()
      },
      {
        id: 'anthropic/claude-3-5-haiku-latest',
        displayName: 'Claude 3.5 Haiku (Latest)',
        provider: 'anthropic',
        contextWindow: 200000,
        maxOutputTokens: 4096,
        inputModalities: ['text'],
        outputModalities: ['text'],
        supportsTools: true,
        supportsVision: false,
        supportsStreaming: true,
        bestFor: 'Fast execution, simple edits',
        description: 'Anthropic\'s fastest and most cost-effective model.',
        lastCheckedAt: new Date().toISOString()
      },
      {
        id: 'openai/gpt-4o',
        displayName: 'GPT-4o',
        provider: 'openai',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputModalities: ['text', 'image'],
        outputModalities: ['text'],
        supportsTools: true,
        supportsVision: true,
        supportsStreaming: true,
        bestFor: 'General problem solving, multilingual tasks',
        description: 'OpenAI\'s flagship multimodal intelligence engine.',
        lastCheckedAt: new Date().toISOString()
      }
    ];

    aggregatedModels.push(...staticCloudModels);

    for (const [providerId, adapter] of this.adapters.entries()) {
      try {
        const models = await adapter.listModels();
        aggregatedModels.push(...models);
      } catch (err) {
        console.error(`Error loading models for provider ${providerId}:`, err);
      }
    }

    this.modelCache = aggregatedModels;
    this.lastRefreshTime = new Date().toISOString();
    this.isRefreshing = false;

    return {
      models: this.modelCache,
      lastRefreshAt: this.lastRefreshTime
    };
  }

  getModels(): ModelMetadata[] {
    // If cache is empty, load statically/initially. Real refresh handles async.
    if (this.modelCache.length === 0) {
      this.refreshModels().catch(console.error);
    }
    return this.modelCache;
  }

  getLastRefreshTime(): string | null {
    return this.lastRefreshTime;
  }

  private startBackgroundRefresh() {
    this.refreshInterval = setInterval(async () => {
      console.log('Background refreshing model cache...');
      await this.refreshModels();
    }, this.config.autoRefreshIntervalMs);
  }

  private stopBackgroundRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  cleanup() {
    this.stopBackgroundRefresh();
  }
}
