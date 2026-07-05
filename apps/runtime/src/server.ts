import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ModelRegistry } from './providers/registry.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup registry
const registry = new ModelRegistry();

// If env vars are loaded, register them into the registry
registry.updateConfig({
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  lmstudioUrl: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
  openaiCompatibleUrl: process.env.CUSTOM_OPENAI_COMPATIBLE_URL || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  nvidiaApiKey: process.env.NVIDIA_API_KEY || ''
});

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[Runtime API] ${req.method} ${req.path}`);
  next();
});

// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /providers
app.get('/providers', (req, res) => {
  try {
    const providers = registry.getProviders();
    res.json({ success: true, providers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /models
app.get('/models', (req, res) => {
  try {
    const models = registry.getModels();
    res.json({
      success: true,
      models,
      lastRefreshAt: registry.getLastRefreshTime()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /models/refresh
app.post('/models/refresh', async (req, res) => {
  try {
    const result = await registry.refreshModels();
    res.json({
      success: true,
      models: result.models,
      lastRefreshAt: result.lastRefreshAt
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /config - allow front-end to submit updated local URLs/keys to registry
app.post('/config', (req, res) => {
  try {
    const { ollamaUrl, lmstudioUrl, openaiCompatibleUrl, openaiApiKey, anthropicApiKey, openrouterApiKey, nvidiaApiKey } = req.body;
    registry.updateConfig({
      ollamaUrl,
      lmstudioUrl,
      openaiCompatibleUrl,
      openaiApiKey,
      anthropicApiKey,
      openrouterApiKey,
      nvidiaApiKey
    });
    res.json({ success: true, message: 'Registry configuration updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Aster Code Runtime Server listening on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log(`========================================`);
});

// Graceful cleanup
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Cleaning up registry...');
  registry.cleanup();
  server.close(() => {
    process.exit(0);
  });
});
