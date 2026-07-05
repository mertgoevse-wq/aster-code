# Model Provider Adapters Setup

Aster Code features a modular registry structure. Every model integration must implement the compiler-safe `ProviderAdapter` interface defined in `apps/runtime/src/providers/types.ts`.

## Implementing a Custom Adapter

To integrate a new LLM provider, create a file in `apps/runtime/src/providers/` implementing the required interface:

```typescript
import { ModelMetadata } from '@aster-code/shared';
import { ProviderAdapter } from './types.js';

export class CustomProviderAdapter implements ProviderAdapter {
  id = 'custom-provider';
  displayName = 'My Custom Provider';

  async health(): Promise<boolean> {
    // Check if the service is up
    return true;
  }

  async listModels(): Promise<ModelMetadata[]> {
    // Query provider endpoint and return normalized models
    return [
      {
        id: 'custom-provider/model-v1',
        displayName: 'Custom Model v1',
        provider: this.id,
        contextWindow: 4096,
        maxOutputTokens: 1024,
        inputModalities: ['text'],
        outputModalities: ['text'],
        supportsTools: false,
        supportsVision: false,
        supportsStreaming: true,
        bestFor: 'Writing helpers',
        description: 'A custom text-generation helper model.',
        lastCheckedAt: new Date().toISOString()
      }
    ];
  }

  async getCapabilities(modelId: string) {
    return {
      supportsTools: false,
      supportsVision: false,
      supportsStreaming: true
    };
  }

  normalizeModel(rawModel: any): ModelMetadata {
    return {
      id: `${this.id}/${rawModel.id}`,
      displayName: rawModel.name,
      provider: this.id,
      contextWindow: 4096,
      maxOutputTokens: 1024,
      inputModalities: ['text'],
      outputModalities: ['text'],
      supportsTools: false,
      supportsVision: false,
      supportsStreaming: true,
      bestFor: 'General',
      description: 'Custom model structure.',
      lastCheckedAt: new Date().toISOString()
    };
  }
}
```

Once implemented, register your adapter inside `apps/runtime/src/providers/registry.ts`:

1. Import the class.
2. Instantiate and add the adapter to the `adapters` Map in `initializeAdapters()`.
3. Map credentials or configurations inside `getProviders()` check routines.

## Supported Adapters in MVP

1. **Ollama**: Queries local instance `tags` endpoint (`/api/tags`) to load active models.
2. **LM Studio**: Connects to the local standard OpenAI compat API endpoint (`/v1/models`).
3. **OpenRouter**: Fetches models list from the OpenRouter catalog API, including descriptions and context parameters.
4. **NVIDIA NIM**: Integrates cloud inference models served from the NVIDIA API catalog.
5. **OpenAI Compatible (Custom)**: Support generic host URLs with optional auth keys.

## Caching and Auto-Refresh
- Aggregated model details are cached in runtime memory.
- **TTL Cache age**: Default 5 minutes (configurable via `MODEL_REFRESH_INTERVAL_MS` in `.env`).
- Clicking the UI Sync button triggers a manual refresh bypass, clearing the cache and executing fresh HTTP queries.

