import { useState, useEffect, useRef } from 'react';
import {
  Key, Database, Trash2, Edit3, AlertCircle, ShieldAlert,
  ToggleLeft, ToggleRight, Copy, Download, Upload, X, Tag, Star, FileJson
} from 'lucide-react';
import { SystemPromptTemplate, ProviderConfigs } from '@aster-code/shared';

const PROMPTS_STORAGE_KEY = 'aster_system_prompts';
const SELECTED_PROMPT_KEY = 'aster_selected_prompt_id';

interface SettingsScreenProps {
  runtimeConnected: boolean;
  onUpdateConfigs: (configs: ProviderConfigs) => Promise<boolean>;
}

function getDefaultPrompts(): SystemPromptTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'prompt-1',
      title: 'Senior Architect Pair Programming',
      description: 'A focused, detailed pair programming prompt that asks for clean, well-tested code.',
      prompt: 'You are a Senior TypeScript Architect. Focus on robust, modular structures, proper type safety, and clean error handling. Always verify build correctness before completing.',
      tags: ['typescript', 'architecture', 'production'],
      isDefault: true,
      isSystemDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prompt-2',
      title: 'Strict Beginner Tutor',
      description: 'Explains complex concepts in plain English, keeps code simple and well-commented.',
      prompt: 'You are a patient programming tutor. Explain code blocks step-by-step, explain design patterns, and avoid over-engineering solutions.',
      tags: ['learning', 'beginner', 'tutorial'],
      isSystemDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prompt-3',
      title: 'Rapid Prototyping',
      description: 'Quick, iterative builds with minimal ceremony.',
      prompt: 'You are a fast prototyping engineer. Favor working code over perfect code. Use simple patterns, ship fast, and iterate quickly. Add comments only where behavior is non-obvious.',
      tags: ['prototyping', 'mvp', 'fast'],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function loadPrompts(): SystemPromptTemplate[] {
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SystemPromptTemplate[];
      // Migrate old prompts without tags/updatedAt
      return parsed.map(p => ({
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : [],
        updatedAt: p.updatedAt || p.createdAt,
      }));
    }
  } catch { /* ignore */ }
  const defaults = getDefaultPrompts();
  localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function savePrompts(prompts: SystemPromptTemplate[]): void {
  localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
}

export function getSelectedPromptId(): string | null {
  return localStorage.getItem(SELECTED_PROMPT_KEY);
}

export function setSelectedPromptId(id: string | null): void {
  if (id) {
    localStorage.setItem(SELECTED_PROMPT_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_PROMPT_KEY);
  }
}

export function getPromptById(id: string): SystemPromptTemplate | undefined {
  const prompts = loadPrompts();
  return prompts.find(p => p.id === id);
}

const EMPTY_FORM = { title: '', prompt: '', description: '', tagInput: '' };

export default function SettingsScreen({ runtimeConnected, onUpdateConfigs }: SettingsScreenProps) {
  // Provider Config state
  const [configs, setConfigs] = useState<ProviderConfigs>({
    ollamaEnabled: true,
    ollamaUrl: 'http://localhost:11434',
    lmstudioEnabled: true,
    lmstudioUrl: 'http://localhost:1234/v1',
    openaiCompatibleEnabled: false,
    openaiCompatibleUrl: '',
    openaiCompatibleApiKey: '',
    openrouterEnabled: false,
    openrouterApiKey: '',
    nvidiaEnabled: false,
    nvidiaApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // System Prompt library state
  const [prompts, setPrompts] = useState<SystemPromptTemplate[]>(() => loadPrompts());
  const [selectedPromptId, setSelectedPromptIdState] = useState<string | null>(() => getSelectedPromptId());
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<string[]>([]);
  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load provider configs on mount
  useEffect(() => {
    const loadData = async () => {
      const savedConfig = localStorage.getItem('aster_provider_configs');
      let localConfigs: ProviderConfigs | null = null;
      if (savedConfig) {
        try { localConfigs = JSON.parse(savedConfig); setConfigs(prev => ({ ...prev, ...localConfigs })); } catch { /* ignore */ }
      }
      if (runtimeConnected) {
        try {
          const res = await fetch('/api/models/status');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.status?.configs) {
              setConfigs(prev => ({ ...prev, ...data.status.configs, ...(localConfigs || {}) }));
            }
          }
        } catch { /* ignore */ }
      }
    };
    loadData();
  }, [runtimeConnected]);

  // Sync selection to localStorage
  const selectPrompt = (id: string | null) => {
    setSelectedPromptIdState(id);
    setSelectedPromptId(id);
  };

  // ----- Prompt CRUD -----

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setTagInput([]);
    setEditingId(null);
  };

  const startEdit = (p: SystemPromptTemplate) => {
    setForm({ title: p.title, prompt: p.prompt, description: p.description || '', tagInput: '' });
    setTagInput(p.tags || []);
    setEditingId(p.id);
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const raw = (e.target as HTMLInputElement).value.trim().replace(/,/g, '');
      if (raw && !tagInput.includes(raw)) {
        setTagInput(prev => [...prev, raw]);
      }
      setForm(prev => ({ ...prev, tagInput: '' }));
    }
  };

  const removeTag = (tag: string) => {
    setTagInput(prev => prev.filter(t => t !== tag));
  };

  const handleSavePrompt = () => {
    if (!form.title.trim() || !form.prompt.trim()) return;

    const now = new Date().toISOString();
    let updated: SystemPromptTemplate[];

    if (editingId) {
      updated = prompts.map(p =>
        p.id === editingId
          ? { ...p, title: form.title.trim(), prompt: form.prompt.trim(), description: form.description.trim() || undefined, tags: tagInput, updatedAt: now }
          : p
      );
    } else {
      const newPrompt: SystemPromptTemplate = {
        id: `prompt-${Date.now()}`,
        title: form.title.trim(),
        prompt: form.prompt.trim(),
        description: form.description.trim() || undefined,
        tags: tagInput,
        createdAt: now,
        updatedAt: now,
      };
      updated = [...prompts, newPrompt];
    }

    setPrompts(updated);
    savePrompts(updated);
    resetForm();
  };

  const handleDuplicate = (p: SystemPromptTemplate) => {
    const now = new Date().toISOString();
    const dup: SystemPromptTemplate = {
      ...p,
      id: `prompt-${Date.now()}`,
      title: `${p.title} (Copy)`,
      isDefault: false,
      isSystemDefault: false,
      createdAt: now,
      updatedAt: now,
      tags: [...p.tags],
    };
    const updated = [...prompts, dup];
    setPrompts(updated);
    savePrompts(updated);
  };

  const handleDeletePrompt = (id: string) => {
    const updated = prompts.filter(p => p.id !== id);
    setPrompts(updated);
    savePrompts(updated);
    if (selectedPromptId === id) selectPrompt(null);
    if (editingId === id) resetForm();
  };

  const handleSetDefault = (id: string) => {
    const updated = prompts.map(p => ({
      ...p,
      isDefault: p.id === id ? !p.isDefault : false,
      updatedAt: new Date().toISOString(),
    }));
    setPrompts(updated);
    savePrompts(updated);
  };

  // ----- Export / Import -----

  const handleExport = () => {
    const json = JSON.stringify(prompts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aster-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string) as SystemPromptTemplate[];
        if (!Array.isArray(imported) || !imported.every(p => p.id && p.title && p.prompt)) {
          throw new Error('Invalid format');
        }
        // Merge: add new ones, skip duplicates by id
        const existingIds = new Set(prompts.map(p => p.id));
        const merged = [...prompts, ...imported.filter(p => !existingIds.has(p.id))];
        setPrompts(merged);
        savePrompts(merged);
      } catch {
        alert('Invalid JSON format. Expected an array of prompt objects.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleImportJson = () => {
    try {
      const imported = JSON.parse(importJson) as SystemPromptTemplate[];
      if (!Array.isArray(imported) || !imported.every(p => p.id && p.title && p.prompt)) {
        throw new Error('Invalid format');
      }
      const existingIds = new Set(prompts.map(p => p.id));
      const merged = [...prompts, ...imported.filter(p => !existingIds.has(p.id))];
      setPrompts(merged);
      savePrompts(merged);
      setImportJson('');
      setShowImport(false);
    } catch {
      alert('Invalid JSON. Paste an array of prompt objects.');
    }
  };

  // ----- Provider Configs -----

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const storageConfigs = { ...configs };
      delete storageConfigs.openaiApiKey;
      delete storageConfigs.anthropicApiKey;
      delete storageConfigs.openrouterApiKey;
      delete storageConfigs.nvidiaApiKey;
      delete storageConfigs.openaiCompatibleApiKey;
      localStorage.setItem('aster_provider_configs', JSON.stringify(storageConfigs));
      const success = await onUpdateConfigs(configs);
      setSaveStatus(success ? 'success' : 'error');
    } catch {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const toggleProvider = (key: keyof ProviderConfigs) => {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const providerFields = [
    { key: 'ollamaEnabled' as const, label: 'Ollama (Local Engine)', urlKey: 'ollamaUrl' as const, urlPlaceholder: 'http://localhost:11434', isLocal: true },
    { key: 'lmstudioEnabled' as const, label: 'LM Studio (Local Server)', urlKey: 'lmstudioUrl' as const, urlPlaceholder: 'http://localhost:1234/v1', isLocal: true },
    { key: 'openrouterEnabled' as const, label: 'OpenRouter (Cloud Hub)', apiKey: 'openrouterApiKey' as const, apiPlaceholder: 'sk-or-...', isLocal: false },
    { key: 'nvidiaEnabled' as const, label: 'NVIDIA NIM (Cloud API)', apiKey: 'nvidiaApiKey' as const, apiPlaceholder: 'nvapi-...', isLocal: false },
    { key: 'openaiCompatibleEnabled' as const, label: 'Custom OpenAI Endpoint', urlKey: 'openaiCompatibleUrl' as const, urlPlaceholder: 'https://api.custom.com/v1', apiKey: 'openaiCompatibleApiKey' as const, apiPlaceholder: 'Bearer key (optional)', isLocal: false },
  ];

  return (
    <div className="h-full w-full bg-ivory-50 overflow-y-auto p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-ivory-200 pb-6">
        <h1 className="font-serif text-3xl font-bold text-ivory-900 leading-tight">Settings</h1>
        <p className="text-sm text-ivory-500 mt-1">Configure active model providers, API endpoints, and system prompt templates.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Left Column: API Keys & Local Endpoints */}
        <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-soft space-y-6">
          <div className="flex justify-between items-center border-b border-ivory-100 pb-3">
            <h2 className="text-sm font-bold text-ivory-800 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-[#866854]" />
              Model Provider Configurations
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-100 rounded-full font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Keys stay in runtime memory</span>
            </div>
          </div>

          <form onSubmit={handleSaveConfigs} className="space-y-6">
            {providerFields.map(({ key, label, urlKey, urlPlaceholder, apiKey, apiPlaceholder }) => (
              <div key={key} className="p-4 bg-ivory-50/50 rounded-xl border border-ivory-200/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ivory-800">{label}</span>
                  <button type="button" onClick={() => toggleProvider(key)} className="text-ivory-500 hover:text-clay transition-all">
                    {configs[key] ? <ToggleRight className="w-9 h-6 text-clay" /> : <ToggleLeft className="w-9 h-6 text-ivory-300" />}
                  </button>
                </div>
                {configs[key] && (
                  <div className="space-y-2">
                    {urlKey && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-ivory-500 uppercase">URL</label>
                        <input type="text" value={configs[urlKey]} onChange={e => setConfigs({ ...configs, [urlKey]: e.target.value })} className="w-full ivory-input bg-white text-xs" placeholder={urlPlaceholder} />
                      </div>
                    )}
                    {apiKey && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-ivory-500 uppercase">API Key</label>
                        <input type="password" value={configs[apiKey] || ''} onChange={e => setConfigs({ ...configs, [apiKey]: e.target.value })} className="w-full ivory-input bg-white text-xs" placeholder={apiPlaceholder} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 bg-ivory-50/30 rounded-xl border border-ivory-200/40 space-y-3">
              <h3 className="text-xs font-bold text-ivory-600">Standard SDK APIs</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500">OpenAI API Key</label>
                  <input type="password" value={configs.openaiApiKey || ''} onChange={e => setConfigs({ ...configs, openaiApiKey: e.target.value })} className="w-full ivory-input bg-white text-xs" placeholder="sk-proj-..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500">Anthropic API Key</label>
                  <input type="password" value={configs.anthropicApiKey || ''} onChange={e => setConfigs({ ...configs, anthropicApiKey: e.target.value })} className="w-full ivory-input bg-white text-xs" placeholder="sk-ant-..." />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button type="submit" disabled={saveStatus === 'saving'} className="ivory-btn-primary px-5 disabled:opacity-50">
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'success' && 'Saved successfully!'}
                {saveStatus === 'error' && 'Failed to save configs'}
                {saveStatus === 'idle' && 'Save configurations'}
              </button>
              {!runtimeConnected && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600"><AlertCircle className="w-3.5 h-3.5" />Connection Offline</div>
              )}
            </div>
          </form>

          <div className="text-[11px] leading-relaxed text-ivory-500 bg-ivory-100/50 p-4 border border-ivory-200 rounded-xl">
            <span className="font-bold text-ivory-800 block mb-1">💡 Professional API Keys Guidance:</span>
            To keep your keys safe, create a <code className="bg-ivory-200 px-1 rounded">.env</code> file under the runtime directory:
            <pre className="font-mono bg-white p-2 rounded border border-ivory-200 mt-2 text-[10px] text-ivory-700 overflow-x-auto select-all">
{`OLLAMA_BASE_URL=http://localhost:11434
LMSTUDIO_BASE_URL=http://localhost:1234/v1
OPENROUTER_API_KEY=your_key_here
NVIDIA_API_KEY=your_key_here`}
            </pre>
          </div>
        </div>

        {/* Right Column: System Prompt Library */}
        <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-soft space-y-6">
          <div className="flex justify-between items-center border-b border-ivory-100 pb-3">
            <h2 className="text-sm font-bold text-ivory-800 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-[#866854]" />
              System Prompt Library
            </h2>
            <div className="flex gap-1">
              <button onClick={handleExport} className="p-1.5 hover:bg-ivory-100 text-ivory-500 hover:text-clay rounded transition-all" title="Export prompts as JSON">
                <Download className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowImport(!showImport)} className="p-1.5 hover:bg-ivory-100 text-ivory-500 hover:text-clay rounded transition-all" title="Import prompts from JSON">
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Selected prompt info */}
          {selectedPromptId && (
            <div className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              Active prompt: <span className="font-semibold">{prompts.find(p => p.id === selectedPromptId)?.title || 'Unknown'}</span>
              <button onClick={() => selectPrompt(null)} className="ml-auto text-ivory-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
            </div>
          )}

          {/* Import panel */}
          {showImport && (
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5"><FileJson className="w-3.5 h-3.5" />Import Prompts</h3>
                <button onClick={() => { setShowImport(false); setImportJson(''); }} className="text-amber-600 hover:text-amber-800"><X className="w-3.5 h-3.5" /></button>
              </div>
              <textarea
                value={importJson}
                onChange={e => setImportJson(e.target.value)}
                placeholder="Paste JSON array of prompts here..."
                className="w-full text-[10px] bg-white border border-amber-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-400 h-20 resize-none font-mono"
              />
              <div className="flex gap-2">
                <button onClick={handleImportJson} disabled={!importJson.trim()} className="text-[10px] font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50">Import JSON</button>
                <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-semibold bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg transition-all">Upload File</button>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </div>
              <p className="text-[9px] text-amber-600">Duplicates (by id) are skipped. Existing prompts are preserved.</p>
            </div>
          )}

          {/* Create/Edit Form */}
          <div className="bg-ivory-50/50 p-4 rounded-xl border border-ivory-200/80 space-y-3">
            <h3 className="text-xs font-semibold text-ivory-700">
              {editingId ? 'Edit system prompt' : 'Create new system prompt'}
            </h3>

            <input
              type="text"
              placeholder="Prompt title"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-clay"
            />
            <input
              type="text"
              placeholder="Brief description (optional)"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-clay"
            />

            <textarea
              placeholder="System prompt instructions..."
              value={form.prompt}
              onChange={e => setForm(prev => ({ ...prev, prompt: e.target.value }))}
              className="w-full text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-clay h-20 resize-none font-mono"
            />

            {/* Tags */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Tag className="w-3 h-3 text-ivory-400" />
                <span className="text-[10px] text-ivory-500">Tags (press Enter or comma to add)</span>
              </div>
              <input
                type="text"
                placeholder="Add tag..."
                value={form.tagInput}
                onChange={e => setForm(prev => ({ ...prev, tagInput: e.target.value }))}
                onKeyDown={addTag}
                className="w-full text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-clay"
              />
              {tagInput.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tagInput.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border border-clay/20 bg-clay/5 text-clay font-medium flex items-center gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-rose-500"><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSavePrompt}
                disabled={!form.title.trim() || !form.prompt.trim()}
                className="text-xs font-semibold bg-[#866854] text-white px-3 py-1.5 rounded-lg hover:bg-[#725441] transition-all disabled:opacity-50"
              >
                {editingId ? 'Save Changes' : 'Add to Library'}
              </button>
              {editingId && (
                <button onClick={resetForm} className="text-xs font-semibold bg-white border border-ivory-200 hover:bg-ivory-100 text-ivory-600 px-3 py-1.5 rounded-lg transition-all">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Prompt list */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
            {prompts.map(p => {
              const isSelected = selectedPromptId === p.id;
              return (
                <div
                  key={p.id}
                  className={`p-3.5 border rounded-xl transition-all flex justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-200 shadow-soft-sm'
                      : 'bg-white border-ivory-200 shadow-soft-sm hover:border-ivory-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-ivory-800">{p.title}</h4>
                      {p.isDefault && <span className="text-[9px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />Default</span>}
                      {p.isSystemDefault && !p.isDefault && <span className="text-[9px] bg-ivory-100 text-ivory-500 font-semibold px-1.5 py-0.5 rounded">Built-in</span>}
                    </div>
                    {p.description && <p className="text-[10px] text-ivory-400 mt-0.5 line-clamp-1">{p.description}</p>}
                    <p className="text-[11px] text-ivory-600 mt-1.5 font-mono line-clamp-2 bg-ivory-50/70 p-2 rounded border border-ivory-100/70">{p.prompt}</p>
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded border border-ivory-200 bg-ivory-50 text-ivory-500 font-mono">{tag}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-[9px] text-ivory-400 mt-1.5">
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => selectPrompt(isSelected ? null : p.id)} className={`p-1 rounded transition-all ${isSelected ? 'text-emerald-600 bg-emerald-100' : 'text-ivory-400 hover:text-clay hover:bg-ivory-100'}`} title="Select as active prompt">
                      <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-emerald-500' : ''}`} />
                    </button>
                    <button onClick={() => handleDuplicate(p)} className="p-1 hover:bg-ivory-100 text-ivory-400 hover:text-blue-600 rounded transition-all" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => startEdit(p)} className="p-1 hover:bg-ivory-100 text-ivory-400 hover:text-clay rounded transition-all" title="Edit">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {!p.isDefault && (
                      <button onClick={() => handleSetDefault(p.id)} className="p-1 hover:bg-ivory-100 text-ivory-400 hover:text-amber-600 rounded transition-all" title="Set as default">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(p.isDefault || p.isSystemDefault) ? null : (
                      <button onClick={() => handleDeletePrompt(p.id)} className="p-1 hover:bg-ivory-100 text-ivory-400 hover:text-rose-600 rounded transition-all" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
