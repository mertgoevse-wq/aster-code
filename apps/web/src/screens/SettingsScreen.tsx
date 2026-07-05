import { useState, useEffect } from 'react';
import { Key, Database, Trash2, Edit3, AlertCircle } from 'lucide-react';
import { SystemPromptTemplate, ProviderConfigs } from '@aster-code/shared';

interface SettingsScreenProps {
  runtimeConnected: boolean;
  onUpdateConfigs: (configs: ProviderConfigs) => Promise<boolean>;
}

export default function SettingsScreen({ runtimeConnected, onUpdateConfigs }: SettingsScreenProps) {
  // Provider Config state
  const [configs, setConfigs] = useState<ProviderConfigs>({
    ollamaUrl: 'http://localhost:11434',
    lmstudioUrl: 'http://localhost:1234/v1',
    openaiCompatibleUrl: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    openrouterApiKey: '',
    nvidiaApiKey: ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // System Prompt library state
  const [prompts, setPrompts] = useState<SystemPromptTemplate[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    // Load config from localStorage if available
    const savedConfig = localStorage.getItem('aster_provider_configs');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfigs(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    // Load System Prompts
    const savedPrompts = localStorage.getItem('aster_system_prompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default library templates
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
  }, []);

  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      localStorage.setItem('aster_provider_configs', JSON.stringify(configs));
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
      // Edit
      updatedPrompts = prompts.map(p =>
        p.id === editingId
          ? { ...p, title: newTitle, prompt: newPrompt, description: newDesc }
          : p
      );
      setEditingId(null);
    } else {
      // Add
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

  return (
    <div className="h-full w-full bg-ivory-50 overflow-y-auto p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-ivory-200 pb-6">
        <h1 className="font-serif text-3xl font-bold text-ivory-900 leading-tight">Settings</h1>
        <p className="text-sm text-ivory-500 mt-1">Configure workspace API endpoints, provider keys, and default agent system prompts.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">
        {/* Left Column: API Keys & Local Endpoints */}
        <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-soft space-y-6">
          <h2 className="text-sm font-bold text-ivory-800 flex items-center gap-2 border-b border-ivory-100 pb-3">
            <Key className="w-4.5 h-4.5 text-[#866854]" />
            Provider Settings & API Keys
          </h2>

          <form onSubmit={handleSaveConfigs} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ivory-600">Ollama API URL</label>
              <input
                type="text"
                value={configs.ollamaUrl}
                onChange={e => setConfigs({ ...configs, ollamaUrl: e.target.value })}
                className="w-full ivory-input"
                placeholder="http://localhost:11434"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ivory-600">LM Studio Server URL</label>
              <input
                type="text"
                value={configs.lmstudioUrl}
                onChange={e => setConfigs({ ...configs, lmstudioUrl: e.target.value })}
                className="w-full ivory-input"
                placeholder="http://localhost:1234/v1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ivory-600">Custom OpenAI Compatible URL</label>
              <input
                type="text"
                value={configs.openaiCompatibleUrl}
                onChange={e => setConfigs({ ...configs, openaiCompatibleUrl: e.target.value })}
                className="w-full ivory-input"
                placeholder="https://api.yourdomain.com/v1"
              />
            </div>

            <div className="border-t border-ivory-100 pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-ivory-600">OpenAI API Key</label>
                <input
                  type="password"
                  value={configs.openaiApiKey}
                  onChange={e => setConfigs({ ...configs, openaiApiKey: e.target.value })}
                  className="w-full ivory-input"
                  placeholder="sk-proj-..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ivory-600">Anthropic API Key</label>
                <input
                  type="password"
                  value={configs.anthropicApiKey}
                  onChange={e => setConfigs({ ...configs, anthropicApiKey: e.target.value })}
                  className="w-full ivory-input"
                  placeholder="sk-ant-..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ivory-600">OpenRouter API Key</label>
                <input
                  type="password"
                  value={configs.openrouterApiKey}
                  onChange={e => setConfigs({ ...configs, openrouterApiKey: e.target.value })}
                  className="w-full ivory-input"
                  placeholder="sk-or-..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-ivory-600">NVIDIA NIM API Key</label>
                <input
                  type="password"
                  value={configs.nvidiaApiKey}
                  onChange={e => setConfigs({ ...configs, nvidiaApiKey: e.target.value })}
                  className="w-full ivory-input"
                  placeholder="nvapi-..."
                />
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
                {saveStatus === 'error' && 'Failed to save config'}
                {saveStatus === 'idle' && 'Save configurations'}
              </button>

              {!runtimeConnected && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Local settings will apply once backend restarts.
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: System Prompt Library */}
        <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-soft space-y-6">
          <h2 className="text-sm font-bold text-ivory-800 flex items-center gap-2 border-b border-ivory-100 pb-3">
            <Database className="w-4.5 h-4.5 text-[#866854]" />
            System Prompt Library
          </h2>

          {/* Form to create/edit system prompts */}
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
