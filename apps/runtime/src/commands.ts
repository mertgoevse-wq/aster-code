import { spawn, ChildProcess } from 'child_process';
import { WORKSPACE_ROOT } from './workspace.js';
import { broadcastCommandStatus, broadcastLog, broadcastPreviewStatus } from './events.js';

// Safe allowlist of commands
export const ALLOWED_COMMANDS = [
  'npm install',
  'npm run dev',
  'npm run build',
  'pnpm install',
  'pnpm run dev',
  'pnpm run build'
];

class CommandRunner {
  private activeProcess: ChildProcess | null = null;
  private status: 'idle' | 'running' | 'success' | 'failed' = 'idle';
  private activeCommand: string | null = null;
  private previewPort: number | null = null;
  private timeoutId: NodeJS.Timeout | null = null;

  getStatus() {
    return {
      status: this.status,
      command: this.activeCommand || undefined,
      previewPort: this.previewPort,
      previewUrl: this.previewPort ? `http://localhost:${this.previewPort}` : null
    };
  }

  async runCommand(fullCommand: string): Promise<void> {
    // 1. Verify allowlist
    if (!ALLOWED_COMMANDS.includes(fullCommand)) {
      throw new Error(`Execution Blocked: Command "${fullCommand}" is not in the safe profile list.`);
    }

    // 2. Stop running command if exists
    if (this.activeProcess) {
      console.log(`[Commands] Stopping currently active process before running "${fullCommand}"...`);
      await this.stopCommand();
    }

    this.status = 'running';
    this.activeCommand = fullCommand;
    this.previewPort = null;
    broadcastCommandStatus(this.status, this.activeCommand);
    broadcastPreviewStatus(null, false);

    console.log(`[Commands] Spawning process: ${fullCommand} in ${WORKSPACE_ROOT}`);
    broadcastLog(`[Aster Sandbox] Executing command: ${fullCommand}\n`);

    // Parse command tokens
    const parts = fullCommand.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // Securely spawn process inside workspace sandbox Cwd
    // Use shell: true to handle cmd scripts seamlessly on Windows and binaries on POSIX
    const child = spawn(cmd, args, {
      cwd: WORKSPACE_ROOT,
      shell: true,
      env: { ...process.env, PORT: '3002' } // hint port if needed
    });

    this.activeProcess = child;

    // Set a safety command execution timeout of 8 minutes
    this.timeoutId = setTimeout(() => {
      console.warn(`[Commands] Command execution timeout reached (8 minutes). Terminating...`);
      broadcastLog(`[Aster Sandbox] Error: Command execution timed out.\n`);
      this.stopCommand();
    }, 8 * 60 * 1000);

    // stdout stream
    child.stdout?.on('data', (data) => {
      const log = data.toString();
      broadcastLog(log);
      this.detectPort(log);
    });

    // stderr stream
    child.stderr?.on('data', (data) => {
      const log = data.toString();
      broadcastLog(log);
      this.detectPort(log);
    });

    child.on('close', (code) => {
      console.log(`[Commands] Process closed with code: ${code}`);
      this.cleanupTimeout();

      if (this.activeProcess === child) {
        this.status = code === 0 ? 'success' : 'failed';
        broadcastCommandStatus(this.status, this.activeCommand || undefined, code);
        this.activeProcess = null;
      }
    });

    child.on('error', (err) => {
      console.error('[Commands] Process error:', err);
      broadcastLog(`[Aster Sandbox] Spawn error: ${err.message}\n`);
      this.cleanupTimeout();

      if (this.activeProcess === child) {
        this.status = 'failed';
        broadcastCommandStatus(this.status, this.activeCommand || undefined, null, err.message);
        this.activeProcess = null;
      }
    });
  }

  async stopCommand(): Promise<void> {
    this.cleanupTimeout();
    if (!this.activeProcess) {
      return;
    }

    const child = this.activeProcess;
    const pid = child.pid;
    this.activeProcess = null;

    console.log(`[Commands] Terminating child process PID: ${pid}...`);
    broadcastLog(`\n[Aster Sandbox] Stopping process...\n`);

    if (pid) {
      try {
        if (process.platform === 'win32') {
          // On Windows, child.kill() leaves orphan child processes (like sirv or vite shell wrappers).
          // taskkill /t /f kills the process tree forcefully.
          spawn('taskkill', ['/pid', pid.toString(), '/t', '/f'], { shell: true });
        } else {
          // POSIX process group kill
          child.kill('SIGTERM');
          // Fallback force kill
          setTimeout(() => {
            try {
              process.kill(-pid, 'SIGKILL');
            } catch (e) {
              child.kill('SIGKILL');
            }
          }, 1000);
        }
      } catch (e: any) {
        console.error('[Commands] Error terminating process:', e);
      }
    }

    this.status = 'idle';
    this.activeCommand = null;
    this.previewPort = null;

    broadcastCommandStatus(this.status);
    broadcastPreviewStatus(null, false);
    broadcastLog(`[Aster Sandbox] Process stopped.\n`);
  }

  private detectPort(log: string) {
    if (this.previewPort) return; // already detected

    // Search for patterns: http://localhost:PORT, http://127.0.0.1:PORT, etc.
    const regexList = [
      /localhost:(\d{4,5})/i,
      /127\.0\.0\.1:(\d{4,5})/i,
      /0\.0\.0\.0:(\d{4,5})/i,
      /port\s*(\d{4,5})/i
    ];

    for (const regex of regexList) {
      const match = log.match(regex);
      if (match && match[1]) {
        const port = parseInt(match[1], 10);
        // Exclude the runtime server port
        if (port !== 3001) {
          this.previewPort = port;
          console.log(`[Commands] Port detected from log stream: ${port}`);
          broadcastLog(`[Aster Sandbox] Dev server detected on http://localhost:${port}\n`);
          broadcastPreviewStatus(port, true);
          break;
        }
      }
    }
  }

  private cleanupTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export const runner = new CommandRunner();
