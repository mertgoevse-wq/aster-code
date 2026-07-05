import { useState, useEffect, useRef } from 'react';
import {
  Folder, File, Terminal, Monitor, Play, Eye, FileText,
  ChevronDown, ChevronRight, Save, Trash2, Plus, RefreshCw,
  XCircle, FileCode, FileJson, FileType, Image, CheckCircle2,
  AlertTriangle, Square, Loader2, PanelBottom
} from 'lucide-react';
import { FileNode } from '@aster-code/shared';
import { apiFetch, apiEventSource } from '../api.ts';

interface WorkbenchScreenProps {
  runtimeConnected: boolean;
}

interface OpenTab {
  path: string;
  content: string;
  hasUnsaved: boolean;
}

function getFileIcon(name: string, isFolder: boolean) {
  if (isFolder) return null;
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return <FileType className="w-3.5 h-3.5 text-blue-500" />;
    case 'js': case 'jsx': return <FileCode className="w-3.5 h-3.5 text-amber-500" />;
    case 'json': return <FileJson className="w-3.5 h-3.5 text-emerald-500" />;
    case 'css': case 'scss': return <FileCode className="w-3.5 h-3.5 text-purple-500" />;
    case 'html': return <FileCode className="w-3.5 h-3.5 text-orange-500" />;
    case 'md': return <FileText className="w-3.5 h-3.5 text-ivory-500" />;
    case 'png': case 'jpg': case 'svg': case 'gif': return <Image className="w-3.5 h-3.5 text-pink-500" />;
    default: return <File className="w-3.5 h-3.5 text-ivory-400" />;
  }
}

export default function WorkbenchScreen({ runtimeConnected }: WorkbenchScreenProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);

  // Multi-tab editor state
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);

  // Terminal
  const [logs, setLogs] = useState<string[]>([]);
  const [commandStatus, setCommandStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  // Preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);

  // File tree
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [showCreateInput, setShowCreateInput] = useState<'file' | 'folder' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPathPrefix, setNewItemPathPrefix] = useState('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // --- File operations ---

  const loadFiles = async () => {
    if (!runtimeConnected) return;
    setFilesLoading(true);
    try {
      const res = await apiFetch('/api/workspace/files');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFiles(data.files);
      }
    } catch { /* ignore */ }
    setFilesLoading(false);
  };

  const openFile = async (filePath: string) => {
    // If already open, switch to it
    const existing = tabs.find(t => t.path === filePath);
    if (existing) {
      setActiveTabPath(filePath);
      return;
    }
    try {
      const res = await apiFetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTabs(prev => [...prev, { path: filePath, content: data.content, hasUnsaved: false }]);
          setActiveTabPath(filePath);
        }
      }
    } catch { /* ignore */ }
  };

  const closeTab = (path: string, skipConfirm?: boolean) => {
    const tab = tabs.find(t => t.path === path);
    if (!skipConfirm && tab?.hasUnsaved) {
      if (!window.confirm(`Unsaved changes in ${path}. Close anyway?`)) return;
    }
    const newTabs = tabs.filter(t => t.path !== path);
    setTabs(newTabs);
    if (activeTabPath === path) {
      setActiveTabPath(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
    }
  };

  const handleEditorChange = (content: string) => {
    if (!activeTabPath) return;
    setTabs(prev => prev.map(t =>
      t.path === activeTabPath ? { ...t, content, hasUnsaved: true } : t
    ));
  };

  const handleSaveFile = async () => {
    if (!activeTabPath) return;
    const tab = tabs.find(t => t.path === activeTabPath);
    if (!tab) return;
    try {
      const res = await apiFetch('/api/workspace/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeTabPath, content: tab.content })
      });
      if (res.ok) {
        setTabs(prev => prev.map(t =>
          t.path === activeTabPath ? { ...t, hasUnsaved: false } : t
        ));
        setLogs(prev => [...prev, `✓ Saved ${activeTabPath}\n`]);
      }
    } catch { /* ignore */ }
  };

  // --- Create / Delete ---

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !showCreateInput) return;
    const targetPath = newItemPathPrefix
      ? `${newItemPathPrefix}/${newItemName.trim()}`
      : newItemName.trim();

    try {
      const body = showCreateInput === 'file'
        ? { path: targetPath, content: '// New file\n' }
        : { path: targetPath };
      const endpoint = showCreateInput === 'file' ? '/api/workspace/file' : '/api/workspace/folder';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setLogs(prev => [...prev, `✓ Created ${showCreateInput}: ${targetPath}\n`]);
        setNewItemName('');
        setShowCreateInput(null);
        await loadFiles();
        if (showCreateInput === 'file') await openFile(targetPath);
      }
    } catch { /* ignore */ }
  };

  const handleDeleteItem = async (filePath: string) => {
    if (!window.confirm(`Delete ${filePath}?`)) return;
    try {
      const res = await apiFetch(`/api/workspace/file?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
      if (res.ok) {
        setLogs(prev => [...prev, `✓ Deleted ${filePath}\n`]);
        closeTab(filePath, true);
      }
    } catch { /* ignore */ }
  };

  // --- Commands ---

  const runCommand = async (command: string) => {
    try {
      const res = await apiFetch('/api/commands/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (!res.ok) {
        const data = await res.json();
        setLogs(prev => [...prev, `✕ ${data.error || 'Command failed'}\n`]);
      }
    } catch (e: any) {
      setLogs(prev => [...prev, `✕ ${e.message}\n`]);
    }
  };

  const stopCommand = async () => {
    try { await apiFetch('/api/commands/stop', { method: 'POST' }); } catch { /* ignore */ }
  };

  // --- SSE ---

  useEffect(() => {
    if (!runtimeConnected) return;
    loadFiles();

    const es = apiEventSource('/api/events');
    es.addEventListener('log', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setLogs(prev => [...prev, data.text]);
    });
    es.addEventListener('command_status', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setCommandStatus(data.status);
    });
    es.addEventListener('preview_status', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      if (data.available && data.url) {
        setPreviewUrl(data.url);
        setPreviewReady(true);
      } else {
        setPreviewUrl(null);
        setPreviewReady(false);
      }
    });
    return () => es.close();
  }, [runtimeConnected]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // --- Helpers ---

  const activeTab = tabs.find(t => t.path === activeTabPath);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const renderNode = (node: FileNode): React.ReactNode => {
    const isFolder = node.type === 'directory';
    const isOpen = !!expandedFolders[node.path];
    const isActive = activeTabPath === node.path;

    if (isFolder) {
      return (
        <div key={node.path}>
          <div className="flex items-center justify-between group hover:bg-ivory-100/60 rounded-md px-2 py-1 cursor-pointer">
            <button
              onClick={() => toggleFolder(node.path)}
              className="flex-1 flex items-center gap-1.5 text-xs font-medium text-ivory-700 text-left min-w-0"
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-ivory-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-ivory-400 shrink-0" />}
              <Folder className="w-3.5 h-3.5 text-[#866854] shrink-0" />
              <span className="truncate">{node.name}</span>
            </button>
            <div className="hidden group-hover:flex gap-0.5 items-center">
              <button onClick={(e) => { e.stopPropagation(); setNewItemPathPrefix(node.path); setShowCreateInput('file'); }} className="p-0.5 hover:bg-ivory-200 rounded text-ivory-400 hover:text-clay" title="New file"><Plus className="w-3 h-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(node.path); }} className="p-0.5 hover:bg-ivory-200 rounded text-ivory-400 hover:text-rose-500" title="Delete"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          {isOpen && node.children && (
            <div className="pl-3 ml-3 border-l border-ivory-200/60 space-y-0.5">
              {node.children.map(child => renderNode(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={node.path} className={`flex items-center justify-between group rounded-md px-2 py-1 cursor-pointer transition-colors ${isActive ? 'bg-clay/10 border border-clay/20' : 'hover:bg-ivory-100/60 border border-transparent'}`}>
        <button
          onClick={() => openFile(node.path)}
          className={`flex-1 flex items-center gap-1.5 text-xs text-left min-w-0 ${isActive ? 'text-clay font-semibold' : 'text-ivory-600'}`}
        >
          <span className="w-3.5 shrink-0" />
          {getFileIcon(node.name, false) || <File className="w-3.5 h-3.5 text-ivory-400 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(node.path); }} className="hidden group-hover:block p-0.5 hover:bg-ivory-200 rounded text-ivory-400 hover:text-rose-500" title="Delete"><Trash2 className="w-3 h-3" /></button>
      </div>
    );
  };

  // --- Render ---

  return (
    <div className="flex h-full w-full bg-ivory-50 overflow-hidden relative">
      {/* ====================================================================
          OFFLINE OVERLAY
          ==================================================================== */}
      {!runtimeConnected && (
        <div className="absolute inset-0 bg-ivory-100/60 backdrop-blur-sm z-40 flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl border border-ivory-200 shadow-lg p-8 max-w-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-sm font-bold text-ivory-800">Runtime Offline</h3>
            <p className="text-xs text-ivory-500 leading-relaxed">
              Start the Express runtime server on <code className="bg-ivory-100 px-1.5 py-0.5 rounded text-[11px]">port 3001</code> to enable file browsing, command execution, and live preview.
            </p>
            <p className="text-[10px] text-ivory-400">Run <code className="bg-ivory-100 px-1 py-0.5 rounded">npm run dev:runtime</code> in your terminal.</p>
          </div>
        </div>
      )}

      {/* ====================================================================
          LEFT: FILE TREE PANEL
          ==================================================================== */}
      <div className="w-56 border-r border-ivory-200 bg-white flex flex-col shrink-0">
        <div className="px-3 py-2.5 border-b border-ivory-100 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-ivory-500 uppercase tracking-wider">Files</span>
          <div className="flex gap-0.5">
            <button
              onClick={() => { setNewItemPathPrefix(''); setShowCreateInput('file'); }}
              disabled={!runtimeConnected}
              className="p-1 rounded hover:bg-ivory-100 text-ivory-400 hover:text-clay disabled:opacity-30"
              title="New file"
            ><Plus className="w-3.5 h-3.5" /></button>
            <button
              onClick={() => { setNewItemPathPrefix(''); setShowCreateInput('folder'); }}
              disabled={!runtimeConnected}
              className="p-1 rounded hover:bg-ivory-100 text-ivory-400 hover:text-clay disabled:opacity-30"
              title="New folder"
            ><Folder className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Create form */}
        {showCreateInput && (
          <form onSubmit={handleCreateItem} className="p-2 bg-ivory-50 border-b border-ivory-200 flex gap-1.5">
            <input
              type="text" autoFocus
              placeholder={showCreateInput === 'file' ? 'filename.ts' : 'folder'}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              className="flex-1 text-[10px] bg-white border border-ivory-200 rounded px-2 py-1 focus:outline-none focus:border-clay"
            />
            <button type="submit" className="bg-[#866854] text-white text-[10px] px-2 py-1 rounded hover:bg-[#725441]">Add</button>
            <button type="button" onClick={() => { setShowCreateInput(null); setNewItemName(''); }} className="text-ivory-400 hover:text-rose-500"><XCircle className="w-4 h-4" /></button>
          </form>
        )}

        {/* File tree */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filesLoading ? (
            <div className="flex items-center justify-center py-10 text-ivory-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Folder className="w-8 h-8 text-ivory-300 mb-2" />
              <p className="text-[10px] text-ivory-400 font-medium">No files yet</p>
              <p className="text-[9px] text-ivory-400 mt-0.5">Click + to create a file or folder</p>
            </div>
          ) : (
            files.map(node => renderNode(node))
          )}
        </div>
      </div>

      {/* ====================================================================
          CENTER: EDITOR + TERMINAL
          ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="h-9 bg-ivory-50 border-b border-ivory-200 flex items-center shrink-0 overflow-x-auto">
          {tabs.length === 0 ? (
            <span className="px-3 text-[10px] text-ivory-400 italic">No files open</span>
          ) : (
            tabs.map(tab => {
              const isActive = tab.path === activeTabPath;
              return (
                <div
                  key={tab.path}
                  className={`h-full flex items-center gap-1.5 px-3 text-[11px] border-r border-ivory-200 cursor-pointer shrink-0 transition-colors ${
                    isActive ? 'bg-white text-ivory-800 font-semibold border-t-2 border-t-clay' : 'text-ivory-500 hover:bg-ivory-100/70'
                  }`}
                  onClick={() => setActiveTabPath(tab.path)}
                >
                  {getFileIcon(tab.path, false) || <File className="w-3 h-3 text-ivory-400" />}
                  <span className="truncate max-w-[120px]">{tab.path.split('/').pop()}</span>
                  {tab.hasUnsaved && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                    className="ml-1 p-0.5 rounded hover:bg-ivory-200 text-ivory-400 hover:text-rose-500"
                  ><XCircle className="w-3 h-3" /></button>
                </div>
              );
            })
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 bg-white border-b border-ivory-200 flex flex-col min-h-0">
          {!activeTab ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
              <FileText className="w-10 h-10 text-ivory-300 mb-3" />
              <h3 className="text-sm font-semibold text-ivory-700">No file selected</h3>
              <p className="text-xs text-ivory-400 mt-1 max-w-[260px] leading-relaxed">
                Click a file in the explorer panel to open it, or create a new file with the + button.
              </p>
            </div>
          ) : (
            <textarea
              value={activeTab?.content || ''}
              onChange={(e) => handleEditorChange(e.target.value)}
              className="flex-1 resize-none p-5 font-mono text-[12px] leading-relaxed text-ivory-700 focus:outline-none selection:bg-clay/20"
              spellCheck={false}
            />
          )}

          {/* Status bar */}
          <div className="h-7 bg-ivory-50 border-t border-ivory-100 flex items-center justify-between px-4 text-[10px] text-ivory-400 font-mono shrink-0">
            <div className="flex items-center gap-3">
              {activeTabPath && <span>{activeTabPath}</span>}
              {activeTab && <span>{(activeTab.content || '').split('\n').length} lines</span>}
            </div>
            <div className="flex items-center gap-3">
              {activeTab?.hasUnsaved ? (
                <span className="flex items-center gap-1 text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Unsaved</span>
              ) : activeTab ? (
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Saved</span>
              ) : null}
              {activeTab && (
                <button onClick={handleSaveFile} className="flex items-center gap-1 text-ivory-500 hover:text-clay font-medium"><Save className="w-3 h-3" />Save</button>
              )}
            </div>
          </div>
        </div>

        {/* Terminal */}
        <div className="h-44 bg-[#1E1E1E] text-ivory-100 flex flex-col shrink-0 font-mono">
          <div className="h-8 bg-[#252525] border-b border-[#333] flex items-center justify-between px-4 text-xs font-semibold text-ivory-400 shrink-0">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              Terminal
              {commandStatus === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            </span>

            <div className="flex gap-1.5">
              {commandStatus === 'running' ? (
                <button onClick={stopCommand} disabled={!runtimeConnected} className="bg-rose-700 hover:bg-rose-800 text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 disabled:opacity-40">
                  <Square className="w-2.5 h-2.5 fill-white" />Stop
                </button>
              ) : (
                <>
                  <button onClick={() => runCommand('npm install')} disabled={!runtimeConnected} className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-ivory-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-medium disabled:opacity-30 disabled:cursor-not-allowed">
                    npm install
                  </button>
                  <button onClick={() => runCommand('npm run dev')} disabled={!runtimeConnected} className="bg-[#866854] hover:bg-[#725441] text-white px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed">
                    <Play className="w-2.5 h-2.5 fill-white" />npm run dev
                  </button>
                </>
              )}
              <button onClick={() => setLogs([])} className="text-ivory-500 hover:text-ivory-300 px-1.5 py-0.5 text-[10px] border border-[#444] hover:border-[#666] rounded">
                Clear
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 text-[11px] leading-relaxed text-emerald-400 space-y-0.5">
            {logs.length === 0 ? (
              <div className="text-ivory-500 italic text-[10px] flex items-center gap-2">
                <PanelBottom className="w-3.5 h-3.5" />
                Terminal idle — click a command button to start the sandbox server.
              </div>
            ) : (
              logs.map((line, i) => <div key={i} className="whitespace-pre-wrap">{line}</div>)
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* ====================================================================
          RIGHT: PREVIEW PANEL
          ==================================================================== */}
      <div className="w-80 border-l border-ivory-200 bg-white flex flex-col shrink-0">
        <div className="h-9 bg-ivory-50 border-b border-ivory-100 flex items-center px-4 justify-between shrink-0">
          <span className="text-[10px] font-bold text-ivory-500 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />Preview
          </span>
          {previewReady && previewUrl && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { if (iframeRef.current) iframeRef.current.src = previewUrl; }}
                className="p-1 rounded hover:bg-ivory-200 text-ivory-400 hover:text-clay"
                title="Reload preview"
              ><RefreshCw className="w-3 h-3" /></button>
              <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 bg-ivory-100/30 p-3 flex flex-col">
          {previewReady && previewUrl ? (
            <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-ivory-200 bg-white shadow-sm">
              {/* Browser frame header */}
              <div className="h-7 bg-ivory-100 border-b border-ivory-200 flex items-center gap-1.5 px-3 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[9px] text-ivory-400 font-mono ml-2 truncate">{previewUrl}</span>
              </div>
              <iframe
                ref={iframeRef}
                src={previewUrl}
                title="Preview"
                className="flex-1 w-full bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <div className="flex-1 border-2 border-dashed border-ivory-300/60 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-white/50">
              <Monitor className="w-8 h-8 text-ivory-300 mb-3" />
              <h4 className="text-xs font-bold text-ivory-600">No preview running</h4>
              <p className="text-[10px] text-ivory-400 max-w-[200px] mt-1.5 leading-relaxed">
                Click <span className="font-semibold text-clay">npm run dev</span> in the terminal to start a dev server. The preview will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
