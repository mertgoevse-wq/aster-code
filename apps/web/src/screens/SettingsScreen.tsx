import { useState, useEffect } from 'react';
import { Key, Database, Trash2, Edit3, AlertCircle, ShieldAlert, ToggleLeft, ToggleRight } from 'lucide-react';
import { SystemPromptTemplate, ProviderConfigs } from '@aster-code/shared';

interface SettingsScreenProps {
  runtimeConnected: boolean;
  onUpdateConfigs: (configs: ProviderConfigs) => Promise<boolean>;
}

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
    anthropicApiKey: ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // System Prompt library state
  const [prompts, setPrompts] = useState<SystemPromptTemplate[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load from local storage and runtime status on mount
  useEffect(() => {
    const loadData = async () => {
      // 1. First load from localStorage for default browser inputs
      const savedConfig = localStorage.getItem('aster_provider_configs');
      let localConfigs: ProviderConfigs | null = null;
      if (savedConfig) {
        try {
          localConfigs = JSON.parse(savedConfig);
          setConfigs(prev => ({ ...prev, ...localConfigs }));
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Query actual runtime configurations if connected
      if (runtimeConnected) {
        try {
          const res = await fetch('/api/models/status');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.status && data.status.configs) {
              const rConfigs = data.status.configs;
              
              setConfigs(prev => ({
                ...prev,
                ollamaEnabled: rConfigs.ollamaEnabled,
                lmstudioEnabled: rConfigs.lmstudioEnabled,
                openrouterEnabled: rConfigs.openrouterEnabled,
                nvidiaEnabled: rConfigs.nvidiaEnabled,
                openaiCompatibleEnabled: rConfigs.openaiCompatibleEnabled,
                // Keep local URLs or fallback
                ...(localConfigs || {})
              }));
            }
          }
        } catch (e) {
          console.warn('Failed to load settings metrics from runtime server', e);
        }
      }
    };

    loadData();

    // Load System Prompts
    const savedPrompts = localStorage.getItem('aster_system_prompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultPrompts: SystemPromptTemplate[] = [
        {
          id: 'prompt-1',
          title: 'Senior Architect Pair Programming',
          description: 'A focused, detailed pair programming prompt that asks for clean, well-tested code.',
          prompt: 'You are a Senior TypeScript Architect. Focus on robust, modular structures, proper type safety, and clean error handling. Always verify build correctness before completing.',
          isSystemDefault: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'prompt-2',
          title: 'Strict Beginner Tutor',
          description: 'Explains complex concepts in plain English, keeps code simple and well-commented.',
          prompt: 'You are a patient programming tutor. Explain code blocks step-by-step, explain design patterns, and avoid over-engineering solutions.',
          createdAt: new Date().toISOString()
        }
      ];
      setPrompts(defaultPrompts);
      localStorage.setItem('aster_system_prompts', JSON.stringify(defaultPrompts));
    }
  }, [runtimeConnected]);

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      // For security, do not save API keys in localStorage
      const storageConfigs = { ...configs };
      delete storageConfigs.openaiApiKey;
      delete storageConfigs.anthropicApiKey;
      delete storageConfigs.openrouterApiKey;
      delete storageConfigs.nvidiaApiKey;
      delete storageConfigs.openaiCompatibleApiKey;
      
      localStorage.setItem('aster_provider_configs', JSON.stringify(storageConfigs));
      
      // Update real runtime memory endpoints
      const success = await onUpdateConfigs(configs);
      if (success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleSavePrompt = () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;

    let updatedPrompts: SystemPromptTemplate[];

    if (editingId) {
      updatedPrompts = prompts.map(p =>
        p.id === editingId
          ? { ...p, title: newTitle, prompt: newPrompt, description: newDesc }
          : p
      );
      setEditingId(null);
    } else {
      const added: SystemPromptTemplate = {
        id: `prompt-${Date.now()}`,
        title: newTitle,
        prompt: newPrompt,
        description: newDesc,
        createdAt: new Date().toISOString()
      };
      updatedPrompts = [...prompts, added];
    }

    setPrompts(updatedPrompts);
    localStorage.setItem('aster_system_prompts', JSON.stringify(updatedPrompts));
    setNewTitle('');
    setNewPrompt('');
    setNewDesc('');
  };

  const handleEditPrompt = (p: SystemPromptTemplate) => {
    setNewTitle(p.title);
    setNewPrompt(p.prompt);
    setNewDesc(p.description || '');
    setEditingId(p.id);
  };

  const handleDeletePrompt = (id: string) => {
    const filtered = prompts.filter(p => p.id !== id);
    setPrompts(filtered);
    localStorage.setItem('aster_system_prompts', JSON.stringify(filtered));
    if (editingId === id) {
      setEditingId(null);
      setNewTitle('');
      setNewPrompt('');
      setNewDesc('');
    }
  };

  const toggleProvider = (key: keyof ProviderConfigs) => {
    setConfigs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
            {/* 1. Ollama */}
            <div className="p-4 bg-ivory-50/50 rounded-xl border border-ivory-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ivory-800">Ollama (Local Engine)</span>
                <button
                  type="button"
                  onClick={() => toggleProvider('ollamaEnabled')}
                  className="text-ivory-500 hover:text-clay transition-all"
                >
                  {configs.ollamaEnabled ? (
                    <ToggleRight className="w-9 h-6 text-clay" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 text-ivory-300" />
                  )}
                </button>
              </div>
              {configs.ollamaEnabled && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500 uppercase">Ollama URL</label>
                  <input
                    type="text"
                    value={configs.ollamaUrl}
                    onChange={e => setConfigs({ ...configs, ollamaUrl: e.target.value })}
                    className="w-full ivory-input bg-white text-xs"
                    placeholder="http://localhost:11434"
                  />
                </div>
              )}
            </div>

            {/* 2. LM Studio */}
            <div className="p-4 bg-ivory-50/50 rounded-xl border border-ivory-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ivory-800">LM Studio (Local Server)</span>
                <button
                  type="button"
                  onClick={() => toggleProvider('lmstudioEnabled')}
                  className="text-ivory-500 hover:text-clay transition-all"
                >
                  {configs.lmstudioEnabled ? (
                    <ToggleRight className="w-9 h-6 text-clay" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 text-ivory-300" />
                  )}
                </button>
              </div>
              {configs.lmstudioEnabled && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500 uppercase">LM Studio URL</label>
                  <input
                    type="text"
                    value={configs.lmstudioUrl}
                    onChange={e => setConfigs({ ...configs, lmstudioUrl: e.target.value })}
                    className="w-full ivory-input bg-white text-xs"
                    placeholder="http://localhost:1234/v1"
                  />
                </div>
              )}
            </div>

            {/* 3. OpenRouter */}
            <div className="p-4 bg-ivory-50/50 rounded-xl border border-ivory-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ivory-800">OpenRouter (Cloud Hub)</span>
                <button
                  type="button"
                  onClick={() => toggleProvider('openrouterEnabled')}
                  className="text-ivory-500 hover:text-clay transition-all"
                >
                  {configs.openrouterEnabled ? (
                    <ToggleRight className="w-9 h-6 text-clay" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 text-ivory-300" />
                  )}
                </button>
              </div>
              {configs.openrouterEnabled && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500 uppercase">API Key</label>
                  <input
                    type="password"
                    value={configs.openrouterApiKey || ''}
                    onChange={e => setConfigs({ ...configs, openrouterApiKey: e.target.value })}
                    className="w-full ivory-input bg-white text-xs"
                    placeholder="Enter OpenRouter API key (sk-or-...)"
                  />
                </div>
              )}
            </div>

            {/* 4. NVIDIA NIM */}
            <div className="p-4 bg-ivory-50/50 rounded-xl border border-ivory-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ivory-800">NVIDIA NIM (Cloud API)</span>
                <button
                  type="button"
                  onClick={() => toggleProvider('nvidiaEnabled')}
                  className="text-ivory-500 hover:text-clay transition-all"
                >
                  {configs.nvidiaEnabled ? (
                    <ToggleRight className="w-9 h-6 text-clay" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 text-ivory-300" />
                  )}
                </button>
              </div>
              {configs.nvidiaEnabled && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500 uppercase">API Key</label>
                  <input
                    type="password"
                    value={configs.nvidiaApiKey || ''}
                    onChange={e => setConfigs({ ...configs, nvidiaApiKey: e.target.value })}
                    className="w-full ivory-input bg-white text-xs"
                    placeholder="Enter NVIDIA API key (nvapi-...)"
                  />
                </div>
              )}
            </div>

            {/* 5. Custom OpenAI-Compatible */}
            <div className="p-4 bg-ivory-50/50 rounded-xl border border-ivory-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ivory-800">Custom OpenAI Endpoint</span>
                <button
                  type="button"
                  onClick={() => toggleProvider('openaiCompatibleEnabled')}
                  className="text-ivory-500 hover:text-clay transition-all"
                >
                  {configs.openaiCompatibleEnabled ? (
                    <ToggleRight className="w-9 h-6 text-clay" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 text-ivory-300" />
                  )}
                </button>
              </div>
              {configs.openaiCompatibleEnabled && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-ivory-500 uppercase">Base URL</label>
                    <input
                      type="text"
                      value={configs.openaiCompatibleUrl}
                      onChange={e => setConfigs({ ...configs, openaiCompatibleUrl: e.target.value })}
                      className="w-full ivory-input bg-white text-xs"
                      placeholder="https://api.yourcustomserver.com/v1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-ivory-500 uppercase">API Key</label>
                    <input
                      type="password"
                      value={configs.openaiCompatibleApiKey || ''}
                      onChange={e => setConfigs({ ...configs, openaiCompatibleApiKey: e.target.value })}
                      className="w-full ivory-input bg-white text-xs"
                      placeholder="Enter optional Bearer key"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Native Defaults Setup */}
            <div className="p-4 bg-ivory-50/30 rounded-xl border border-ivory-200/40 space-y-3">
              <h3 className="text-xs font-bold text-ivory-600">Standard SDK APIs</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500">OpenAI API Key</label>
                  <input
                    type="password"
                    value={configs.openaiApiKey || ''}
                    onChange={e => setConfigs({ ...configs, openaiApiKey: e.target.value })}
                    className="w-full ivory-input bg-white text-xs"
                    placeholder="sk-proj-..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-ivory-500">Anthropic API Key</label>
                  <input
                    type="password"
                    value={configs.anthropicApiKey || ''}
                    onChange={e => setConfigs({ ...configs, anthropicApiKey: e.target.value })}
                    className="w-full ivory-input bg-white text-xs"
                    placeholder="sk-ant-..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className="ivory-btn-primary px-5 disabled:opacity-50"
              >
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'success' && 'Saved successfully!'}
                {saveStatus === 'error' && 'Failed to save configs'}
                {saveStatus === 'idle' && 'Save configurations'}
              </button>

              {!runtimeConnected && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Connection Offline
                </div>
              )}
            </div>
          </form>

          {/* Secure Instruction Box */}
          <div className="text-[11px] leading-relaxed text-ivory-500 bg-ivory-100/50 p-4 border border-ivory-200 rounded-xl">
            <span className="font-bold text-ivory-800 block mb-1">💡 Professional API Keys Guidance:</span>
            To keep your keys safe from browser theft or session exposure, we recommend storing them permanently on your local drive. Create a `.env` file under the runtime directory and paste them:
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
          <h2 className="text-sm font-bold text-ivory-800 flex items-center gap-2 border-b border-ivory-100 pb-3">
            <Database className="w-4.5 h-4.5 text-[#866854]" />
            System Prompt Library
          </h2>

          <div className="bg-ivory-50/50 p-4 rounded-xl border border-ivory-200/80 space-y-3">
            <h3 className="text-xs font-semibold text-ivory-700">
              {editingId ? 'Edit system prompt template' : 'Create new system prompt template'}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Template Title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="col-span-2 text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-clay"
              />
              <input
                type="text"
                placeholder="Brief description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="col-span-2 text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-clay"
              />
            </div>
            
            <textarea
              placeholder="System prompt instructions..."
              value={newPrompt}
              onChange={e => setNewPrompt(e.target.value)}
              className="w-full text-xs bg-white border border-ivory-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-clay h-20 resize-none font-mono"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handleSavePrompt}
                disabled={!newTitle.trim() || !newPrompt.trim()}
                className="text-xs font-semibold bg-[#866854] text-white px-3 py-1.5 rounded-lg hover:bg-[#725441] transition-all disabled:opacity-50"
              >
                {editingId ? 'Save Changes' : 'Add to Library'}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setNewTitle('');
                    setNewPrompt('');
                    setNewDesc('');
                  }}
                  className="text-xs font-semibold bg-white border border-ivory-200 hover:bg-ivory-100 text-ivory-600 px-3 py-1.5 rounded-lg transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Prompt list */}
          <div className="space-y-3">
            {prompts.map(p => (
              <div
                key={p.id}
                className="p-4 bg-white border border-ivory-200 rounded-xl shadow-soft-sm flex justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-ivory-800">{p.title}</h4>
                    {p.isSystemDefault && (
                      <span className="text-[9px] bg-ivory-100 text-ivory-500 font-semibold px-1.5 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <p className="text-[10px] text-ivory-400 mt-0.5">{p.description}</p>
                  <p className="text-[11px] text-ivory-600 mt-2 font-mono line-clamp-2 bg-ivory-50/50 p-2 rounded border border-ivory-100">{p.prompt}</p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleEditPrompt(p)}
                    className="p-1 hover:bg-ivory-100 text-ivory-500 hover:text-clay rounded transition-all"
                    title="Edit template"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {!p.isSystemDefault && (
                    <button
                      onClick={() => handleDeletePrompt(p.id)}
                      className="p-1 hover:bg-ivory-100 text-ivory-500 hover:text-rose-600 rounded transition-all"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
