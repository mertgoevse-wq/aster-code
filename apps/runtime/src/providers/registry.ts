import { ModelMetadata, ProviderInfo, ProviderId, ProviderConfigs } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';
import { OllamaAdapter } from './ollama.js';
import { LMStudioAdapter } from './lmstudio.js';
import { OpenRouterAdapter } from './openrouter.js';
import { NvidiaAdapter } from './nvidia.js';
import { OpenAICompatibleAdapter } from './openaiCompatible.js';

export class ModelRegistry {
  private adapters: Map<ProviderId, ProviderAdapter> = new Map();
  private modelCache: ModelMetadata[] = [];
  private lastRefreshTime: string | null = null;
  private isRefreshing = false;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastCheckedStatus: Record<ProviderId, { status: 'online' | 'offline' | 'unconfigured'; latencyMs?: number }> = {
    openai: { status: 'unconfigured' },
    anthropic: { status: 'unconfigured' },
    openrouter: { status: 'unconfigured' },
    ollama: { status: 'offline' },
    lmstudio: { status: 'offline' },
    'openai-compatible': { status: 'unconfigured' },
    nvidia: { status: 'unconfigured' }
  };

  // Cache configuration
  private config = {
    ollamaEnabled: true,
    ollamaUrl: 'http://localhost:11434',
    lmstudioEnabled: true,
    lmstudioUrl: 'http://localhost:1234/v1',
    openaiCompatibleEnabled: false,
    openaiCompatibleUrl: '',
    openaiCompatibleApiKey: '',
    openrouterEnabled: false,
    openrouterApiKey: '',
    nvidiaEnabled: false,
    nvidiaApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    autoRefreshEnabled: true,
    autoRefreshIntervalMs: 5 * 60 * 1000 // 5 minutes TTL default
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

    // Reset background polling if configs changed
    this.stopBackgroundRefresh();
    if (this.config.autoRefreshEnabled) {
      this.startBackgroundRefresh();
    }
  }

  private initializeAdapters() {
    this.adapters.clear();

    // 1. Ollama
    if (this.config.ollamaEnabled) {
      this.adapters.set('ollama', new OllamaAdapter(this.config.ollamaUrl));
    }

    // 2. LM Studio
    if (this.config.lmstudioEnabled) {
      this.adapters.set('lmstudio', new LMStudioAdapter(this.config.lmstudioUrl));
    }

    // 3. OpenRouter
    if (this.config.openrouterEnabled) {
      this.adapters.set('openrouter', new OpenRouterAdapter(this.config.openrouterApiKey));
    }

    // 4. NVIDIA NIM
    if (this.config.nvidiaEnabled) {
      this.adapters.set('nvidia', new NvidiaAdapter(this.config.nvidiaApiKey));
    }

    // 5. OpenAI Compatible (Custom)
    if (this.config.openaiCompatibleEnabled && this.config.openaiCompatibleUrl) {
      this.adapters.set(
        'openai-compatible',
        new OpenAICompatibleAdapter(
          'openai-compatible',
          'Custom LLM',
          this.config.openaiCompatibleUrl,
          this.config.openaiCompatibleApiKey
        )
      );
    }

    // 6. Direct OpenAI/Anthropic cloud options setup when configured
    if (this.config.openaiApiKey) {
      this.adapters.set(
        'openai',
        new OpenAICompatibleAdapter(
          'openai',
          'OpenAI API',
          'https://api.openai.com/v1',
          this.config.openaiApiKey
        )
      );
    }

    if (this.config.anthropicApiKey) {
      // For MVP 0.1 listModels, we wrap it into OpenAI Compatible adapter targeting Anthropic's proxy if relevant,
      // or standard static models mapping.
      this.adapters.set(
        'anthropic',
        new OpenAICompatibleAdapter(
          'anthropic',
          'Anthropic API',
          'https://api.anthropic.com/v1', // Placeholder URL for type resolution
          this.config.anthropicApiKey
        )
      );
    }
  }

  getProviders(): ProviderInfo[] {
    const list: ProviderId[] = ['openai', 'anthropic', 'openrouter', 'ollama', 'lmstudio', 'openai-compatible', 'nvidia'];
    return list.map(id => {
      let enabled = false;
      let configured = false;
      let baseUrl = '';

      switch (id) {
        case 'openai':
          enabled = !!this.config.openaiApiKey;
          configured = !!this.config.openaiApiKey;
          baseUrl = 'https://api.openai.com/v1';
          break;
        case 'anthropic':
          enabled = !!this.config.anthropicApiKey;
          configured = !!this.config.anthropicApiKey;
          baseUrl = 'https://api.anthropic.com/v1';
          break;
        case 'openrouter':
          enabled = this.config.openrouterEnabled;
          configured = !!this.config.openrouterApiKey;
          baseUrl = 'https://openrouter.ai/api/v1';
          break;
        case 'nvidia':
          enabled = this.config.nvidiaEnabled;
          configured = !!this.config.nvidiaApiKey;
          baseUrl = 'https://integrate.api.nvidia.com/v1';
          break;
        case 'ollama':
          enabled = this.config.ollamaEnabled;
          configured = true;
          baseUrl = this.config.ollamaUrl;
          break;
        case 'lmstudio':
          enabled = this.config.lmstudioEnabled;
          configured = true;
          baseUrl = this.config.lmstudioUrl;
          break;
        case 'openai-compatible':
          enabled = this.config.openaiCompatibleEnabled;
          configured = !!this.config.openaiCompatibleUrl;
          baseUrl = this.config.openaiCompatibleUrl;
          break;
      }

      return {
        id,
        displayName: this.adapters.get(id)?.displayName || id.toUpperCase(),
        enabled,
        configured,
        baseUrl: baseUrl || undefined
      };
    });
  }

  async refreshModels(bypassCache = true): Promise<{ models: ModelMetadata[]; lastRefreshAt: string }> {
    // If cache is fresh (within TTL) and we don't bypass, return cache
    if (!bypassCache && this.modelCache.length > 0 && this.lastRefreshTime) {
      const cacheAgeMs = Date.now() - new Date(this.lastRefreshTime).getTime();
      if (cacheAgeMs < this.config.autoRefreshIntervalMs) {
        return { models: this.modelCache, lastRefreshAt: this.lastRefreshTime };
      }
    }

    if (this.isRefreshing) {
      return { models: this.modelCache, lastRefreshAt: this.lastRefreshTime || new Date().toISOString() };
    }

    this.isRefreshing = true;
    const aggregatedModels: ModelMetadata[] = [];

    // Prepopulate standard defaults if their parent provider is enabled but returns empty list
    // (e.g. Anthropic/OpenAI APIs which might not have a public listModels endpoint without keys)
    const fallbackCloudModels: ModelMetadata[] = [
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
        bestFor: 'Coding & Planning',
        description: 'Default Anthropic model.',
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
        bestFor: 'Structured Analysis',
        description: 'Default OpenAI flagship model.',
        lastCheckedAt: new Date().toISOString()
      }
    ];

    // Query active adapters in parallel
    const promises = Array.from(this.adapters.entries()).map(async ([providerId, adapter]) => {
      const startTime = Date.now();
      try {
        const isUp = await adapter.health();
        if (isUp) {
          const models = await adapter.listModels();
          this.lastCheckedStatus[providerId] = {
            status: 'online',
            latencyMs: Date.now() - startTime
          };
          return { providerId, models };
        } else {
          this.lastCheckedStatus[providerId] = { status: 'offline' };
          return { providerId, models: [] };
        }
      } catch (err) {
        this.lastCheckedStatus[providerId] = { status: 'offline' };
        return { providerId, models: [] };
      }
    });

    const results = await Promise.all(promises);

    for (const { providerId, models } of results) {
      if (models.length > 0) {
        aggregatedModels.push(...models);
      } else if (providerId === 'openai' && this.config.openaiApiKey) {
        aggregatedModels.push(fallbackCloudModels[1]);
      } else if (providerId === 'anthropic' && this.config.anthropicApiKey) {
        aggregatedModels.push(fallbackCloudModels[0]);
      }
    }

    // Always keep fallback if registry is completely empty (helps beginner onboarding feel robust)
    if (aggregatedModels.length === 0) {
      aggregatedModels.push(...fallbackCloudModels);
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
    // If cache is empty, load statically. If TTL expired, refresh asynchronously.
    if (this.modelCache.length === 0) {
      this.refreshModels(false).catch(console.error);
    } else if (this.lastRefreshTime) {
      const ageMs = Date.now() - new Date(this.lastRefreshTime).getTime();
      if (ageMs > this.config.autoRefreshIntervalMs) {
        console.log('Cache TTL expired. Triggering async refresh...');
        this.refreshModels(false).catch(console.error);
      }
    }
    return this.modelCache;
  }

  getLastRefreshTime(): string | null {
    return this.lastRefreshTime;
  }

  getStatusMetrics() {
    return {
      isRefreshing: this.isRefreshing,
      lastCheckedAt: this.lastRefreshTime,
      cacheTTLMs: this.config.autoRefreshIntervalMs,
      cacheSize: this.modelCache.length,
      providerStatus: this.lastCheckedStatus,
      configs: {
        ollamaEnabled: this.config.ollamaEnabled,
        lmstudioEnabled: this.config.lmstudioEnabled,
        openrouterEnabled: this.config.openrouterEnabled,
        nvidiaEnabled: this.config.nvidiaEnabled,
        openaiCompatibleEnabled: this.config.openaiCompatibleEnabled,
        openaiConfigured: !!this.config.openaiApiKey,
        anthropicConfigured: !!this.config.anthropicApiKey
      }
    };
  }

  private startBackgroundRefresh() {
    this.refreshInterval = setInterval(async () => {
      console.log('Background refreshing model cache...');
      await this.refreshModels(true);
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
