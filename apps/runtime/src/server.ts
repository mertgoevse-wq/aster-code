import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ModelRegistry } from './providers/registry.js';
import {
  listFiles,
  readFile,
  writeFile,
  deleteFile,
  createFolder,
  initializeWorkspace
} from './workspace.js';
import { runner } from './commands.js';
import { addClient, removeClient } from './events.js';

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

// Setup workspace boilerplate if empty
initializeWorkspace();

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  if (req.path !== '/events') {
    console.log(`[Runtime API] ${req.method} ${req.path}`);
  }
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

// POST /config
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

/* ==========================================================================
   WORKSPACE FILES ENDPOINTS
   ========================================================================== */

// GET /workspace/files
app.get('/workspace/files', (req, res) => {
  try {
    const files = listFiles();
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /workspace/file
app.get('/workspace/file', (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Query parameter "path" is required' });
    }
    const content = readFile(filePath);
    res.json({ success: true, content });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /workspace/file
app.post('/workspace/file', (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'Body fields "path" and "content" are required' });
    }
    writeFile(filePath, content);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /workspace/file
app.delete('/workspace/file', (req, res) => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Query parameter "path" is required' });
    }
    deleteFile(filePath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /workspace/folder
app.post('/workspace/folder', (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ success: false, error: 'Body field "path" is required' });
    }
    createFolder(folderPath);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   COMMAND RUNNER ENDPOINTS
   ========================================================================== */

// POST /commands/run
app.post('/commands/run', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, error: 'Body field "command" is required' });
    }
    await runner.runCommand(command);
    res.json({ success: true, status: runner.getStatus() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /commands/stop
app.post('/commands/stop', async (req, res) => {
  try {
    await runner.stopCommand();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ==========================================================================
   SERVER-SENT EVENTS (SSE) ENDPOINT
   ========================================================================== */

// GET /events
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  res.write('\n');
  addClient(res);

  req.on('close', () => {
    removeClient(res);
  });
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
  console.log('SIGTERM signal received. Cleaning up registry and processes...');
  registry.cleanup();
  runner.stopCommand().catch(console.error);
  server.close(() => {
    process.exit(0);
  });
});
