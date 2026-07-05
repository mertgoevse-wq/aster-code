import { OpenAICompatibleAdapter } from './openaiCompatible.js';

export class NvidiaAdapter extends OpenAICompatibleAdapter {
  constructor(apiKey?: string, baseUrl = 'https://integrate.api.nvidia.com/v1') {
    super('nvidia', 'NVIDIA NIM', baseUrl, apiKey);
  }
}
