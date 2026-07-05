import { ModelMetadata } from '@aster-code/shared';

export interface ProviderAdapter {
  id: string;
  displayName: string;
  listModels(): Promise<ModelMetadata[]>;
  health(): Promise<boolean>;
  getCapabilities(modelId: string): Promise<{
    supportsTools: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
  }>;
  normalizeModel(rawModel: any): ModelMetadata;
}
