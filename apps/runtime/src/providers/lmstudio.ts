import { OpenAICompatibleAdapter } from './openaiCompatible.js';

export class LMStudioAdapter extends OpenAICompatibleAdapter {
  constructor(baseUrl = 'http://localhost:1234/v1') {
    super('lmstudio', 'LM Studio', baseUrl);
  }
}
