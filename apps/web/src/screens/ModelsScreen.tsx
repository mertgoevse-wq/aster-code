import { useState } from 'react';
import { Cpu, RefreshCw, Layers, ShieldCheck, Zap, Sliders, Info, Server, Clock } from 'lucide-react';
import { ModelMetadata, ProviderInfo } from '@aster-code/shared';

interface ModelsScreenProps {
  models: ModelMetadata[];
  providers: ProviderInfo[];
  onRefreshModels: () => void;
  isRefreshing: boolean;
  lastRefreshTime: string | null;
  runtimeConnected: boolean;
}

export default function ModelsScreen({
  models,
  providers,
  onRefreshModels,
  isRefreshing,
  lastRefreshTime,
  runtimeConnected
}: ModelsScreenProps) {
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [showRawPayload, setShowRawPayload] = useState<boolean>(false);

  // Filter models based on selection
  const filteredModels = models.filter(m => {
    if (selectedProviderFilter === 'all') return true;
    return m.provider === selectedProviderFilter;
  });

  // Automatically select first model in filtered list if current selection is invalid
  const activeModels = filteredModels;
  const currentModel = activeModels.find(m => m.id === selectedModelId) || activeModels[0];

  const formatTokens = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const getContextPercentage = (ctx: number) => {
    // scale relative to 200k max
    const maxVal = 200000;
    const percentage = Math.min((ctx / maxVal) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className="h-full w-full bg-ivory-50 overflow-y-auto p-8 flex flex-col gap-8">
      {/* Header section */}
      <div className="flex justify-between items-end border-b border-ivory-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ivory-900 leading-tight">Model Registry</h1>
          <p className="text-sm text-ivory-500 mt-1">
            Query local nodes, refresh endpoint model capacities, and audit model specs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshTime && (
            <span className="text-[11px] text-ivory-400 font-medium flex items-center gap-1 bg-white px-2.5 py-1.5 border border-ivory-200 rounded-lg shadow-soft-sm">
              <Clock className="w-3 h-3 text-[#866854]" />
              Synced: {new Date(lastRefreshTime).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefreshModels}
            disabled={isRefreshing || !runtimeConnected}
            className="ivory-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : 'Sync Provider Models'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Selection & Filters Column */}
        <div className="col-span-1 space-y-6">
          <h2 className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-ivory-400" />
            Selection Controllers
          </h2>

          <div className="bg-white border border-ivory-200 rounded-xl p-5 shadow-soft space-y-4">
            {/* Provider Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-ivory-500 uppercase">Filter Provider</label>
              <select
                value={selectedProviderFilter}
                onChange={(e) => {
                  setSelectedProviderFilter(e.target.value);
                  setSelectedModelId('');
                }}
                className="w-full text-xs bg-ivory-50 border border-ivory-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-clay font-medium text-ivory-800"
              >
                <option value="all">All Providers</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.displayName} ({p.enabled ? 'Active' : 'Disabled'})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Dropdown Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-ivory-500 uppercase">Select Model</label>
              <select
                value={currentModel?.id || ''}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="w-full text-xs bg-ivory-50 border border-ivory-200 rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-clay font-medium text-ivory-800"
              >
                {activeModels.length === 0 ? (
                  <option value="">No models found</option>
                ) : (
                  activeModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({m.provider})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Integrations Status */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-semibold text-ivory-400 tracking-widest block pl-1">Connection Matrix</span>
            <div className="space-y-2">
              {providers.map(p => (
                <div key={p.id} className="bg-white border border-ivory-200 rounded-xl p-3 shadow-soft-sm flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-ivory-400" />
                    <span className="font-semibold text-ivory-800 capitalize">{p.displayName}</span>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${p.enabled ? 'bg-emerald-500' : 'bg-ivory-300'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model Inspector Column */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-ivory-400" />
            Model Specifications Inspector
          </h2>

          {!currentModel ? (
            <div className="bg-white border border-ivory-200 rounded-xl p-12 text-center text-ivory-400">
              <Cpu className="w-10 h-10 mx-auto text-[#866854] mb-3 opacity-30" />
              <h3 className="text-sm font-semibold text-ivory-800">No active models selected</h3>
              <p className="text-xs text-ivory-500 mt-1 max-w-sm mx-auto">
                Sync provider models or adjust filter choices to inspect model parameters.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-ivory-200 rounded-xl p-6 shadow-soft space-y-6">
              {/* Main Model Metadata */}
              <div className="flex justify-between items-start border-b border-ivory-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-clay/10 text-clay border border-clay/20 font-bold px-2 py-0.5 rounded uppercase font-sans">
                      {currentModel.provider}
                    </span>
                    <h3 className="text-lg font-bold text-ivory-900">{currentModel.displayName}</h3>
                  </div>
                  <p className="text-xs text-ivory-500 font-mono mt-1 select-all">{currentModel.id}</p>
                </div>
                {currentModel.deprecated && (
                  <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-100 font-bold px-2 py-1 rounded">
                    Deprecated
                  </span>
                )}
              </div>

              {/* Description box */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider">Description</h4>
                <p className="text-xs text-ivory-700 bg-ivory-50 p-4 border border-ivory-200 rounded-xl leading-relaxed">
                  {currentModel.description}
                </p>
              </div>

              {/* Specifications grid */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  {/* Context Window visual slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-ivory-500">Context Window</span>
                      <span className="text-ivory-800">{formatTokens(currentModel.contextWindow)} tokens</span>
                    </div>
                    <div className="w-full bg-ivory-100 rounded-full h-2">
                      <div
                        className="bg-[#866854] h-2 rounded-full transition-all duration-500"
                        style={{ width: getContextPercentage(currentModel.contextWindow) }}
                      />
                    </div>
                  </div>

                  {/* Modalities list */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider block">Input Modalities</span>
                    <div className="flex gap-1.5">
                      {currentModel.inputModalities.map(m => (
                        <span key={m} className="text-[10px] bg-ivory-100 text-ivory-600 px-2 py-0.5 border border-ivory-200 rounded uppercase font-semibold">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Maximum outputs limits */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider block">Max Output Limit</span>
                    <div className="text-sm font-bold text-ivory-800 flex items-baseline gap-1">
                      <span>{formatTokens(currentModel.maxOutputTokens)}</span>
                      <span className="text-[10px] font-normal text-ivory-400">tokens</span>
                    </div>
                  </div>

                  {/* Best use case */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider block">Recommended Use Case</span>
                    <div className="text-xs text-[#866854] font-semibold bg-sand-50 border border-sand-200 px-3 py-1.5 rounded-lg">
                      {currentModel.bestFor}
                    </div>
                  </div>
                </div>
              </div>

              {/* Capabilities checklist */}
              <div className="border-t border-ivory-100 pt-5 space-y-2">
                <h4 className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider block">Model Capabilities</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                    currentModel.supportsTools
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
                      : 'bg-ivory-100/50 border-ivory-200 text-ivory-400'
                  }`}>
                    <ShieldCheck className={`w-4.5 h-4.5 ${currentModel.supportsTools ? 'text-emerald-600' : 'text-ivory-300'}`} />
                    <span>Tool Calling</span>
                  </div>

                  <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                    currentModel.supportsVision
                      ? 'bg-sky-50/50 border-sky-100 text-sky-800'
                      : 'bg-ivory-100/50 border-ivory-200 text-ivory-400'
                  }`}>
                    <Layers className={`w-4.5 h-4.5 ${currentModel.supportsVision ? 'text-sky-600' : 'text-ivory-300'}`} />
                    <span>Vision Processing</span>
                  </div>

                  <div className={`p-3 border rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                    currentModel.supportsStreaming
                      ? 'bg-amber-50/50 border-amber-100 text-amber-800'
                      : 'bg-ivory-100/50 border-ivory-200 text-ivory-400'
                  }`}>
                    <Zap className={`w-4.5 h-4.5 ${currentModel.supportsStreaming ? 'text-amber-600' : 'text-ivory-300'}`} />
                    <span>Streaming Responses</span>
                  </div>
                </div>
              </div>

              {/* Raw Visual API Payload */}
              {currentModel.raw && (
                <div className="border-t border-ivory-100 pt-5">
                  <button
                    onClick={() => setShowRawPayload(!showRawPayload)}
                    className="text-xs font-semibold text-ivory-500 hover:text-[#866854] flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {showRawPayload ? 'Hide raw provider JSON payload' : 'Show raw provider JSON payload'}
                  </button>
                  {showRawPayload && (
                    <pre className="mt-3 p-4 bg-ivory-900 text-emerald-400 text-[10px] font-mono rounded-xl overflow-x-auto max-h-60 leading-normal select-all">
                      {JSON.stringify(currentModel.raw, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
