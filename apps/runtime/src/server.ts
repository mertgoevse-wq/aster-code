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
import { sessionStore } from './agent/sessionStore.js';
import { classifyTask, selectSkillsForTask, generatePlan } from './agent/planner.js';
import { routeAgentTasks } from './agent/agentRouter.js';
import { executeApprovedPlan } from './agent/loop.js';
import { skillsRegistry } from './skills/registry.js';

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

/* ==========================================================================
   AGENT LOOP API ENDPOINTS
   ========================================================================== */

// GET /agent/skills — List all registered skills
app.get('/agent/skills', (req, res) => {
  try {
    const skills = skillsRegistry.getAllSkills();
    res.json({ success: true, skills });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /agent/skills/:id — Update a skill's status or execution mode
app.patch('/agent/skills/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, executionMode } = req.body;
    const updated = skillsRegistry.updateSkill(id, { status, executionMode });
    if (!updated) {
      return res.status(404).json({ success: false, error: `Skill "${id}" not found.` });
    }
    res.json({ success: true, skill: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /agent/session — Create a new agent session
app.post('/agent/session', (req, res) => {
  try {
    const { task } = req.body;
    if (!task || typeof task !== 'string' || !task.trim()) {
      return res.status(400).json({ success: false, error: 'Body field "task" (non-empty string) is required.' });
    }

    const session = sessionStore.createSession(task.trim());
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /agent/session/:id — Retrieve session info with plan and events
app.get('/agent/session/:id', (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session "${req.params.id}" not found.` });
    }
    res.json({
      success: true,
      info: session.info,
      plan: session.plan,
      events: session.events
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /agent/session/:id/plan — Classify task and generate execution plan
app.post('/agent/session/:id/plan', (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session "${req.params.id}" not found.` });
    }

    if (session.info.status === 'executing') {
      return res.status(409).json({ success: false, error: 'Session is already executing.' });
    }

    // 1. Run the routing pipeline (intent classifier → skill router → agent router)
    const routing = routeAgentTasks(session.info.taskDescription);

    // 2. Classify task (legacy, used for plan generation)
    const classification = classifyTask(session.info.taskDescription);

    // 3. Update session with task type
    sessionStore.updateSession(session.info.id, {
      taskType: classification.taskType,
      status: 'planning'
    });

    // 4. Generate plan using routed skills (fallback to legacy selector)
    const selectedSkillIds = routing.selectedSkills.length > 0
      ? routing.selectedSkills.map(s => s.skillId)
      : selectSkillsForTask(classification.taskType, skillsRegistry.getActiveSkills());

    const plan = generatePlan(
      session.info.id,
      session.info.taskDescription,
      classification.taskType,
      selectedSkillIds
    );

    // 5. Store plan
    sessionStore.setPlan(session.info.id, plan);

    // 6. Emit plan-created event
    sessionStore.addEvent(session.info.id, {
      id: `evt-${Date.now()}`,
      sessionId: session.info.id,
      type: 'plan-created',
      title: 'Plan generated',
      message: `Task classified as "${classification.taskType}" with ${plan.steps.length} steps.`,
      status: 'done',
      timestamp: new Date().toISOString()
    });

    const updatedSession = sessionStore.getSession(session.info.id)!;
    res.json({
      success: true,
      classification,
      routing,
      plan,
      selectedSkills: selectedSkillIds
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /agent/session/:id/approve — Approve and execute the plan
app.post('/agent/session/:id/approve', async (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session "${req.params.id}" not found.` });
    }

    if (!session.plan) {
      return res.status(400).json({ success: false, error: 'No plan found for this session. Generate a plan first.' });
    }

    if (session.plan.status !== 'pending-approval') {
      return res.status(409).json({
        success: false,
        error: `Plan is in "${session.plan.status}" state. Only "pending-approval" plans can be approved.`
      });
    }

    // Mark plan as approved
    session.plan.status = 'approved';
    session.plan.updatedAt = new Date().toISOString();
    sessionStore.updateSession(session.info.id, { status: 'executing' });

    sessionStore.addEvent(session.info.id, {
      id: `evt-${Date.now()}`,
      sessionId: session.info.id,
      type: 'approval-required',
      title: 'Plan approved',
      message: 'User approved the plan. Starting execution...',
      status: 'done',
      timestamp: new Date().toISOString()
    });

    // Execute plan (MVP: simulated steps only)
    const events = await executeApprovedPlan(session.info.id, session.plan);

    res.json({
      success: true,
      plan: session.plan,
      events
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /agent/session/:id/reject — Reject the plan
app.post('/agent/session/:id/reject', (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session "${req.params.id}" not found.` });
    }

    if (!session.plan) {
      return res.status(400).json({ success: false, error: 'No plan found for this session.' });
    }

    session.plan.status = 'rejected';
    session.plan.updatedAt = new Date().toISOString();
    sessionStore.updateSession(session.info.id, { status: 'rejected' });

    sessionStore.addEvent(session.info.id, {
      id: `evt-${Date.now()}`,
      sessionId: session.info.id,
      type: 'step-blocked',
      title: 'Plan rejected',
      message: 'User rejected the plan. No actions were taken.',
      status: 'blocked',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, plan: session.plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /agent/session/:id/events — Get events for a session
app.get('/agent/session/:id/events', (req, res) => {
  try {
    const session = sessionStore.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: `Session "${req.params.id}" not found.` });
    }

    const since = req.query.since as string | undefined;
    const events = sessionStore.getEvents(session.info.id, since);
    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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
