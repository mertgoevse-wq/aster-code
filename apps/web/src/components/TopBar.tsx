import { useState, useRef, useEffect } from 'react';
import {
  Cpu, RefreshCw, AlertTriangle, Clock, Zap, Eye,
  Wrench, ChevronDown, X, Info, Server, Layers
} from 'lucide-react';
import { ModelMetadata, ProviderInfo } from '@aster-code/shared';

interface CacheStatus {
  isRefreshing: boolean;
  lastCheckedAt: string | null;
  cacheTTLMs: number;
  cacheSize: number;
  providerStatus: Record<string, { status: string; latencyMs?: number }>;
}

interface TopBarProps {
  title: string;
  models: ModelMetadata[];
  providers: ProviderInfo[];
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  runtimeConnected: boolean;
  onRefreshModels: () => void;
  isRefreshing: boolean;
  lastRefreshTime: string | null;
  cacheStatus: CacheStatus | null;
  autoRefreshEnabled: boolean;
  autoRefreshIntervalS: number;
  onAutoRefreshToggle: (enabled: boolean) => void;
  onAutoRefreshInterval: (seconds: number) => void;
}

function formatTokens(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num.toString();
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function TopBar({
  title,
  models,
  providers,
  selectedModelId,
  setSelectedModelId,
  runtimeConnected,
  onRefreshModels,
  isRefreshing,
  lastRefreshTime: _lastRefreshTime,
  cacheStatus,
  autoRefreshEnabled,
  autoRefreshIntervalS,
  onAutoRefreshToggle,
  onAutoRefreshInterval
}: TopBarProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showDetailCard, setShowDetailCard] = useState(false);
  const [showAutoRefreshMenu, setShowAutoRefreshMenu] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const autoRefreshRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (detailRef.current && !detailRef.current.contains(e.target as Node)) {
        setShowDetailCard(false);
      }
      if (autoRefreshRef.current && !autoRefreshRef.current.contains(e.target as Node)) {
        setShowAutoRefreshMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter models by selected provider
  const filteredModels = models.filter(m =>
    selectedProvider === 'all' ? true : m.provider === selectedProvider
  );

  const currentModel = models.find(m => m.id === selectedModelId) || filteredModels[0] || null;

  const autoRefreshOptions = [
    { label: '1 min', value: 60 },
    { label: '3 min', value: 180 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '30 min', value: 1800 },
  ];

  return (
    <header className="h-16 border-b border-ivory-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
      {/* Title / Breadcrumb */}
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ivory-800 uppercase tracking-widest text-[11px] font-sans">
          Studio / <span className="text-[#866854] font-medium font-serif capitalize text-sm tracking-normal font-bold">{title}</span>
        </h2>
      </div>

      {/* Model Picker + Controls */}
      <div className="flex items-center gap-3">
        {runtimeConnected ? (
          <>
            {/* Provider filter */}
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-ivory-400" />                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    // Auto-select first model from newly filtered list
                    const newFiltered = models.filter(m =>
                      e.target.value === 'all' ? true : m.provider === e.target.value
                    );
                    if (newFiltered.length > 0) {
                      setSelectedModelId(newFiltered[0].id);
                    }
                  }}
                  className="text-[11px] bg-ivory-50 border border-ivory-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-clay/60 focus:ring-1 focus:ring-clay/20 font-medium text-ivory-700 max-w-[130px]"
              >
                <option value="all">All Providers</option>
                {providers.filter(p => p.enabled).map(p => (
                  <option key={p.id} value={p.id}>{p.displayName}</option>
                ))}
              </select>
            </div>

            {/* Model dropdown */}
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-ivory-400" />
              {filteredModels.length === 0 ? (
                <span className="text-[11px] text-ivory-400 bg-ivory-50 border border-ivory-200 rounded-lg px-2 py-1.5 italic">
                  {isRefreshing ? 'Loading models...' : 'No models available'}
                </span>
              ) : (
                <select
                  value={selectedModelId || ''}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="text-[11px] bg-ivory-50 border border-ivory-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-clay/60 focus:ring-1 focus:ring-clay/20 font-medium text-ivory-700 max-w-[220px] truncate"
                >
                  {filteredModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Model detail toggle */}
            {currentModel && (
              <div className="relative" ref={detailRef}>
                <button
                  onClick={() => setShowDetailCard(!showDetailCard)}
                  className={`p-1.5 rounded-lg transition-all border ${
                    showDetailCard
                      ? 'bg-clay/10 border-clay/30 text-clay'
                      : 'hover:bg-ivory-100 border-transparent text-ivory-400 hover:text-clay'
                  }`}
                  title="Model details"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>

                {/* Detail popover card */}
                {showDetailCard && currentModel && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-ivory-200 rounded-xl shadow-lg z-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-clay/10 text-clay border border-clay/20 font-bold px-1.5 py-0.5 rounded uppercase">
                          {currentModel.provider}
                        </span>
                        <span className="text-sm font-bold text-ivory-800 truncate">{currentModel.displayName}</span>
                      </div>
                      <button onClick={() => setShowDetailCard(false)} className="text-ivory-400 hover:text-ivory-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-ivory-500 leading-relaxed">{currentModel.description}</p>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-ivory-50 rounded-lg p-2 border border-ivory-100">
                        <span className="text-ivory-400 block">Context Window</span>
                        <span className="font-bold text-ivory-800">{formatTokens(currentModel.contextWindow)}</span>
                      </div>
                      <div className="bg-ivory-50 rounded-lg p-2 border border-ivory-100">
                        <span className="text-ivory-400 block">Max Output</span>
                        <span className="font-bold text-ivory-800">{formatTokens(currentModel.maxOutputTokens)}</span>
                      </div>
                      <div className="bg-ivory-50 rounded-lg p-2 border border-ivory-100">
                        <span className="text-ivory-400 block">Best For</span>
                        <span className="font-bold text-clay">{currentModel.bestFor}</span>
                      </div>
                      <div className="bg-ivory-50 rounded-lg p-2 border border-ivory-100">
                        <span className="text-ivory-400 block">Last Checked</span>
                        <span className="font-bold text-ivory-700 text-[9px]">{timeAgo(currentModel.lastCheckedAt)}</span>
                      </div>
                    </div>

                    {/* Capability badges */}
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                        currentModel.supportsStreaming ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-ivory-100 text-ivory-400 border-ivory-200'
                      }`}>
                        <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                        {currentModel.supportsStreaming ? 'Streaming' : 'No Streaming'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                        currentModel.supportsTools ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-ivory-100 text-ivory-400 border-ivory-200'
                      }`}>
                        <Wrench className="w-2.5 h-2.5 inline mr-0.5" />
                        {currentModel.supportsTools ? 'Tools' : 'No Tools'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                        currentModel.supportsVision ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-ivory-100 text-ivory-400 border-ivory-200'
                      }`}>
                        <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                        {currentModel.supportsVision ? 'Vision' : 'No Vision'}
                      </span>
                    </div>

                    {/* Input modalities */}
                    <div className="flex gap-1 items-center">
                      <Layers className="w-3 h-3 text-ivory-400" />
                      {currentModel.inputModalities.map(m => (
                        <span key={m} className="text-[8px] bg-ivory-100 text-ivory-500 px-1 py-0.5 rounded font-mono uppercase">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={onRefreshModels}
              disabled={isRefreshing}
              className={`p-1.5 hover:bg-ivory-100 rounded-lg border border-transparent hover:border-ivory-200 transition-all ${
                isRefreshing ? 'animate-spin text-clay' : 'text-ivory-500 hover:text-clay'
              }`}
              title="Refresh provider models"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Cache status */}
            {cacheStatus && (
              <div className="flex items-center gap-1 text-[9px] text-ivory-400 font-mono bg-ivory-50 border border-ivory-200 rounded-lg px-2 py-1">
                <Clock className="w-2.5 h-2.5" />
                {cacheStatus.lastCheckedAt ? timeAgo(cacheStatus.lastCheckedAt) : 'never'}
              </div>
            )}

            {/* Auto-refresh toggle + interval */}
            <div className="relative" ref={autoRefreshRef}>
              <button
                onClick={() => setShowAutoRefreshMenu(!showAutoRefreshMenu)}
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg border transition-all ${
                  autoRefreshEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-ivory-100 text-ivory-400 border-ivory-200 hover:bg-ivory-200'
                }`}
                title="Auto-refresh settings"
              >
                <RefreshCw className={`w-3 h-3 ${autoRefreshEnabled ? 'text-emerald-500' : ''}`} />
                {autoRefreshEnabled ? `Every ${Math.floor(autoRefreshIntervalS / 60)}m` : 'Auto Off'}
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {showAutoRefreshMenu && (
                <div className="absolute top-full right-0 mt-1.5 w-44 bg-white border border-ivory-200 rounded-xl shadow-lg z-50 p-2 space-y-1">
                  <button
                    onClick={() => {
                      onAutoRefreshToggle(!autoRefreshEnabled);
                      setShowAutoRefreshMenu(false);
                    }}
                    className={`w-full text-left text-[11px] px-2.5 py-2 rounded-lg font-medium transition-colors ${
                      autoRefreshEnabled
                        ? 'bg-ivory-50 text-ivory-700 hover:bg-ivory-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {autoRefreshEnabled ? 'Turn Off' : 'Turn On'}
                  </button>
                  {autoRefreshEnabled && (
                    <div className="border-t border-ivory-100 pt-1 mt-1 space-y-0.5">
                      {autoRefreshOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            onAutoRefreshInterval(opt.value);
                            setShowAutoRefreshMenu(false);
                          }}
                          className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg transition-colors ${
                            autoRefreshIntervalS === opt.value
                              ? 'bg-clay/10 text-clay font-semibold'
                              : 'text-ivory-600 hover:bg-ivory-50'
                          }`}
                        >
                          {opt.label}
                          {autoRefreshIntervalS === opt.value && ' ✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Connection offline. Start runtime server.</span>
          </div>
        )}
      </div>
    </header>
  );
}
