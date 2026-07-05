import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ModelRegistry } from './providers/registry.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup registry
const registry = new ModelRegistry();

// Initialize registry configs from environment variable states
registry.updateConfig({
  ollamaEnabled: process.env.OLLAMA_ENABLED !== 'false',
  ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  lmstudioEnabled: process.env.LMSTUDIO_ENABLED !== 'false',
  lmstudioUrl: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
  openaiCompatibleEnabled: !!process.env.OPENAI_COMPATIBLE_BASE_URL,
  openaiCompatibleUrl: process.env.OPENAI_COMPATIBLE_BASE_URL || '',
  openaiCompatibleApiKey: process.env.OPENAI_COMPATIBLE_API_KEY || '',
  openrouterEnabled: !!process.env.OPENROUTER_API_KEY,
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  nvidiaEnabled: !!process.env.NVIDIA_API_KEY,
  nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  autoRefreshIntervalMs: process.env.MODEL_REFRESH_INTERVAL_MS ? parseInt(process.env.MODEL_REFRESH_INTERVAL_MS, 10) : 300000
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
    const result = await registry.refreshModels(true);
    res.json({
      success: true,
      models: result.models,
      lastRefreshAt: result.lastRefreshAt
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /models/status
app.get('/models/status', (req, res) => {
  try {
    const status = registry.getStatusMetrics();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /config - allow front-end to submit toggles and URLs to the registry
app.post('/config', (req, res) => {
  try {
    const {
      ollamaEnabled,
      ollamaUrl,
      lmstudioEnabled,
      lmstudioUrl,
      openaiCompatibleEnabled,
      openaiCompatibleUrl,
      openaiCompatibleApiKey,
      openrouterEnabled,
      openrouterApiKey,
      nvidiaEnabled,
      nvidiaApiKey,
      openaiApiKey,
      anthropicApiKey,
      autoRefreshIntervalMs
    } = req.body;

    registry.updateConfig({
      ollamaEnabled,
      ollamaUrl,
      lmstudioEnabled,
      lmstudioUrl,
      openaiCompatibleEnabled,
      openaiCompatibleUrl,
      openaiCompatibleApiKey,
      openrouterEnabled,
      openrouterApiKey,
      nvidiaEnabled,
      nvidiaApiKey,
      openaiApiKey,
      anthropicApiKey,
      autoRefreshIntervalMs: autoRefreshIntervalMs ? parseInt(autoRefreshIntervalMs, 10) : undefined
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
