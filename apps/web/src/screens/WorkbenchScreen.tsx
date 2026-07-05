import { useState, useEffect, useRef } from 'react';
import { Folder, File, Terminal as TermIcon, Monitor, Play, Eye, FileText, ChevronDown, ChevronRight, Save, Trash2, Plus, RefreshCw, XCircle } from 'lucide-react';
import { FileNode } from '@aster-code/shared';

interface WorkbenchScreenProps {
  runtimeConnected: boolean;
}

export default function WorkbenchScreen({ runtimeConnected }: WorkbenchScreenProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [commandStatus, setCommandStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // File expansion state
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Inputs for creating files/folders
  const [showCreateInput, setShowCreateInput] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemPathPrefix, setNewItemPathPrefix] = useState<string>('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch file tree
  const loadFiles = async () => {
    if (!runtimeConnected) return;
    try {
      const res = await fetch('/api/workspace/files');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFiles(data.files);
        }
      }
    } catch (e) {
      console.error('Failed to load workspace files', e);
    }
  };

  // Read file contents
  const loadFileContent = async (filePath: string) => {
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActiveFilePath(filePath);
          setEditorContent(data.content);
          setHasUnsavedChanges(false);
        }
      }
    } catch (e) {
      console.error('Failed to load file contents', e);
    }
  };

  // Write file contents
  const handleSaveFile = async () => {
    if (!activeFilePath) return;
    try {
      const res = await fetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeFilePath, content: editorContent })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHasUnsavedChanges(false);
          setLogs(prev => [...prev, `[System] Saved changes to ${activeFilePath}\n`]);
        }
      }
    } catch (e) {
      console.error('Failed to save file changes', e);
    }
  };

  // Create new item (file or folder)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !showCreateInput) return;

    const targetPath = newItemPathPrefix 
      ? `${newItemPathPrefix}/${newItemName.trim()}`
      : newItemName.trim();

    try {
      let res;
      if (showCreateInput === 'file') {
        res = await fetch('/api/workspace/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath, content: '// New file created in Aster' })
        });
      } else {
        res = await fetch('/api/workspace/folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath })
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(prev => [...prev, `[System] Created ${showCreateInput} at ${targetPath}\n`]);
          setNewItemName('');
          setShowCreateInput(null);
          await loadFiles();
          if (showCreateInput === 'file') {
            await loadFileContent(targetPath);
          }
        }
      }
    } catch (e) {
      console.error('Failed to create workspace item', e);
    }
  };

  // Delete item
  const handleDeleteItem = async (filePath: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filePath}?`)) return;
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLogs(prev => [...prev, `[System] Deleted ${filePath}\n`]);
          if (activeFilePath === filePath) {
            setActiveFilePath(null);
            setEditorContent('');
          }
          await loadFiles();
        }
      }
    } catch (e) {
      console.error('Failed to delete workspace item', e);
    }
  };

  // Trigger commands
  const runProfileCommand = async (command: string) => {
    try {
      setLogs([]); // Clear logs for fresh start
      const res = await fetch('/api/commands/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (!res.ok) {
        const data = await res.json();
        setLogs(prev => [...prev, `[Error] ${data.error || 'Command failed'}\n`]);
      }
    } catch (e: any) {
      setLogs(prev => [...prev, `[Error] Failed to trigger execution: ${e.message}\n`]);
    }
  };

  const stopActiveCommand = async () => {
    try {
      await fetch('/api/commands/stop', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  // Load files and connect SSE log listeners on mount
  useEffect(() => {
    if (!runtimeConnected) return;

    loadFiles();

    // Setup SSE connection
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('log', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLogs(prev => [...prev, data.text]);
    });

    eventSource.addEventListener('command_status', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setCommandStatus(data.status);
      setRunningCommand(data.command || null);
    });

    eventSource.addEventListener('preview_status', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.available && data.url) {
        setPreviewUrl(data.url);
      } else {
        setPreviewUrl(null);
      }
    });

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection lost', err);
    };

    return () => {
      eventSource.close();
    };
  }, [runtimeConnected]);

  // Scroll to bottom of logs automatically
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));
  };

  // Recursive folder node tree render helper
  const renderNode = (node: FileNode) => {
    const isFolder = node.type === 'directory';
    const isOpen = !!expandedFolders[node.path];

    if (isFolder) {
      return (
        <div key={node.path} className="select-none">
          <div className="flex items-center justify-between group hover:bg-ivory-100/60 rounded-lg px-2.5 py-1">
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex-1 flex items-center gap-1.5 text-xs font-semibold text-ivory-700 text-left"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-ivory-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-ivory-400 shrink-0" />
              )}
              <Folder className="w-3.5 h-3.5 text-[#866854] shrink-0" />
              <span className="truncate">{node.name}</span>
            </button>

            {/* Quick folder action controllers */}
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              <button
                onClick={() => {
                  setNewItemPathPrefix(node.path);
                  setShowCreateInput('file');
                }}
                className="p-0.5 hover:bg-ivory-200 rounded text-ivory-500 hover:text-clay"
                title="Create file here"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDeleteItem(node.path)}
                className="p-0.5 hover:bg-ivory-200 rounded text-ivory-500 hover:text-rose-600"
                title="Delete directory"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isOpen && node.children && (
            <div className="pl-3.5 border-l border-ivory-200/60 ml-4.5 mt-0.5 space-y-0.5">
              {node.children.map(child => renderNode(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={node.path} className="flex items-center justify-between group hover:bg-ivory-100/60 rounded-lg px-2.5 py-1">
        <button
          onClick={() => loadFileContent(node.path)}
          className={`flex-1 flex items-center gap-1.5 text-xs text-left ${
            activeFilePath === node.path ? 'text-ivory-900 font-bold' : 'text-ivory-600'
          }`}
        >
          <span className="w-3.5 h-3.5 shrink-0" />
          <File className="w-3.5 h-3.5 text-ivory-400 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        
        <button
          onClick={() => handleDeleteItem(node.path)}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-ivory-200 rounded text-ivory-500 hover:text-rose-600"
          title="Delete file"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-ivory-50 overflow-hidden relative select-none">
      {/* Offline Alert Mask */}
      {!runtimeConnected && (
        <div className="absolute inset-0 bg-ivory-100/60 backdrop-blur-[1.5px] z-50 flex flex-col items-center justify-center text-center p-8">
          <div className="p-4 bg-white rounded-2xl border border-ivory-200 shadow-soft max-w-sm">
            <Monitor className="w-8 h-8 mx-auto text-[#866854] mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-ivory-800 mb-1">Runtime Not Connected Yet</h3>
            <p className="text-xs text-ivory-500 mb-4">
              Connect to the local server or start the Express runtime backend on port 3001 to enable workbench file systems and dev previews.
            </p>
          </div>
        </div>
      )}

      {/* Explorer Column */}
      <div className="w-60 border-r border-ivory-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-ivory-200 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans">Workspace files</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setNewItemPathPrefix('');
                setShowCreateInput('file');
              }}
              className="p-1 hover:bg-ivory-100 rounded text-ivory-500 hover:text-clay"
              title="New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setNewItemPathPrefix('');
                setShowCreateInput('folder');
              }}
              className="p-1 hover:bg-ivory-100 rounded text-ivory-500 hover:text-clay"
              title="New Folder"
            >
              <Folder className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Create Input Field modal overlay */}
        {showCreateInput && (
          <form onSubmit={handleCreateItem} className="p-3 bg-ivory-50 border-b border-ivory-200 flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder={showCreateInput === 'file' ? 'filename.js' : 'folder_name'}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="flex-1 text-xs bg-white border border-ivory-200 rounded px-2 py-1 focus:outline-none focus:border-clay"
            />
            <button
              type="submit"
              className="bg-[#866854] text-white text-[10px] px-2 py-1 rounded hover:bg-[#725441]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateInput(null);
                setNewItemName('');
              }}
              className="text-ivory-500 hover:text-rose-600 p-1"
            >
              <XCircle className="w-4.5 h-4.5" />
            </button>
          </form>
        )}

        {/* Recursive File Tree */}
        <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {files.length === 0 ? (
            <div className="text-center p-6 text-ivory-400 text-xs">
              Workspace empty.
            </div>
          ) : (
            files.map(node => renderNode(node))
          )}
        </div>
      </div>

      {/* Editor & Terminal Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Simple Editor Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-b border-ivory-200">
          <div className="h-10 bg-ivory-50/50 border-b border-ivory-200 flex items-center px-4 justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-ivory-500">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px] font-semibold text-ivory-700">
                {activeFilePath ? activeFilePath : 'No active file'}
              </span>
              {hasUnsavedChanges && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Unsaved changes" />
              )}
            </div>

            {activeFilePath && (
              <button
                onClick={handleSaveFile}
                disabled={!hasUnsavedChanges}
                className="text-[10px] font-semibold bg-[#866854] text-white hover:bg-[#725441] disabled:bg-ivory-200 disabled:text-ivory-400 px-2.5 py-1 rounded transition-all flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
            )}
          </div>

          <textarea
            value={editorContent}
            onChange={(e) => {
              setEditorContent(e.target.value);
              setHasUnsavedChanges(true);
            }}
            placeholder="// Click on a file from explorer to edit content."
            disabled={!activeFilePath}
            className="flex-1 resize-none p-6 font-mono text-[12px] leading-relaxed text-ivory-700 focus:outline-none select-text disabled:bg-[#FAF9F6] disabled:text-ivory-400"
          />
        </div>

        {/* Command Buttons & Console Log panel */}
        <div className="h-48 bg-ivory-900 text-ivory-100 flex flex-col shrink-0 font-mono">
          <div className="h-9 bg-ivory-950 border-b border-ivory-800 flex items-center justify-between px-4 text-xs font-semibold text-ivory-400 shrink-0">
            <span className="flex items-center gap-2">
              <TermIcon className="w-3.5 h-3.5" />
              Terminal logs
            </span>

            {/* Quick execution controls */}
            <div className="flex gap-2">
              {commandStatus === 'running' ? (
                <button
                  onClick={stopActiveCommand}
                  className="bg-rose-700 text-white hover:bg-rose-800 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Stop process ({runningCommand})
                </button>
              ) : (
                <>
                  <button
                    onClick={() => runProfileCommand('npm install')}
                    className="bg-ivory-800 hover:bg-ivory-700 text-ivory-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-semibold"
                  >
                    npm install
                  </button>
                  <button
                    onClick={() => runProfileCommand('npm run dev')}
                    className="bg-[#866854] hover:bg-[#725441] text-white px-2.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5" />
                    npm run dev
                  </button>
                </>
              )}
              <button
                onClick={() => setLogs([])}
                className="text-ivory-500 hover:text-ivory-300 px-1.5 py-0.5 text-[10px] border border-ivory-800 hover:border-ivory-700 rounded"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Streaming command output logs window */}
          <div className="flex-1 overflow-y-auto p-4 text-[10.5px] leading-relaxed text-emerald-400 space-y-0.5 select-text">
            {logs.length === 0 ? (
              <div className="text-ivory-500 italic">Terminal idle. Click "npm install" or "npm run dev" to spin up sandbox nodes.</div>
            ) : (
              logs.map((logLine, idx) => (
                <div key={idx} className="whitespace-pre-wrap">{logLine}</div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* Live Preview Pane */}
      <div className="w-96 border-l border-ivory-200 bg-white flex flex-col shrink-0">
        <div className="h-10 border-b border-ivory-200 bg-ivory-50/50 flex items-center px-4 justify-between shrink-0">
          <span className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </span>
          {previewUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
                className="p-1 hover:bg-ivory-100 rounded text-ivory-500 hover:text-clay"
                title="Reload Preview"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          )}
        </div>

        {/* Live Preview container box */}
        <div className="flex-1 bg-ivory-100/40 p-4 flex flex-col">
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Aster Sandbox Frame"
              className="flex-1 w-full bg-white border border-ivory-200 rounded-xl shadow-soft"
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="flex-1 border border-dashed border-ivory-300/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white">
              <Monitor className="w-8 h-8 text-ivory-400 mb-2 opacity-50" />
              <h4 className="text-xs font-bold text-ivory-700">Preview offline</h4>
              <p className="text-[10px] text-ivory-400 max-w-[200px] mt-1.5 leading-relaxed">
                Start your local dev process using the terminal controls (e.g. click "npm run dev") to expose preview frames.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
