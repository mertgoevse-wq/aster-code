import { Response } from 'express';
import { CommandStatusEvent, PreviewStatusEvent } from '@aster-code/shared';

// Pool of active SSE clients
const clients: Set<Response> = new Set();

// Current cached states to push immediately to newly connected clients
let lastCommandStatus: CommandStatusEvent = { status: 'idle' };
let lastPreviewStatus: PreviewStatusEvent = { available: false };

export function addClient(res: Response) {
  clients.add(res);

  // Send initial states immediately
  sendEvent(res, 'command_status', lastCommandStatus);
  sendEvent(res, 'preview_status', lastPreviewStatus);
}

export function removeClient(res: Response) {
  clients.delete(res);
}

function sendEvent(res: Response, type: string, data: any) {
  try {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    console.error('[Events] Error writing SSE socket stream:', err);
  }
}

export function broadcastLog(text: string) {
  clients.forEach(res => {
    sendEvent(res, 'log', { text });
  });
}

export function broadcastCommandStatus(
  status: 'idle' | 'running' | 'success' | 'failed',
  command?: string,
  exitCode?: number | null,
  error?: string
) {
  lastCommandStatus = { status, command, exitCode, error };
  clients.forEach(res => {
    sendEvent(res, 'command_status', lastCommandStatus);
  });
}

export function broadcastPreviewStatus(port: number | null, available: boolean) {
  lastPreviewStatus = {
    port,
    available,
    url: port ? `http://localhost:${port}` : null
  };
  clients.forEach(res => {
    sendEvent(res, 'preview_status', lastPreviewStatus);
  });
}
