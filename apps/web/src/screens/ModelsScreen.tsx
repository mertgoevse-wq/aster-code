import { Cpu, RefreshCw, Layers, ShieldCheck, Zap, Sliders } from 'lucide-react';
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

  const formatTokens = (num: number) => {
    if (num >= 1000000) return `${num / 1000000}M`;
    if (num >= 1000) return `${num / 1000}k`;
    return num.toString();
  };

  return (
    <div className="h-full w-full bg-ivory-50 overflow-y-auto p-8 flex flex-col gap-8">
      {/* Top Header Section */}
      <div className="flex justify-between items-end border-b border-ivory-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ivory-900 leading-tight">Model Registry</h1>
          <p className="text-sm text-ivory-500 mt-1">Manage local endpoints, verify connection statuses, and select model defaults.</p>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshTime && (
            <span className="text-[11px] text-ivory-400 font-medium">
              Last refresh: {new Date(lastRefreshTime).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefreshModels}
            disabled={isRefreshing || !runtimeConnected}
            className="ivory-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Models'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Providers Section */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-ivory-400" />
            Integrations & Providers
          </h2>

          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="bg-white border border-ivory-200/80 rounded-xl p-4 shadow-soft flex items-center justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-ivory-800 capitalize">{provider.displayName}</h3>
                  <p className="text-[10px] text-ivory-500 font-mono mt-0.5">
                    {provider.baseUrl ? provider.baseUrl : 'Cloud Service'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    provider.configured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-ivory-100 text-ivory-500 border-ivory-200'
                  }`}>
                    {provider.configured ? 'Configured' : 'Needs Config'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Models List Section */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-ivory-400" />
            Active Registered Models ({models.length})
          </h2>

          {models.length === 0 ? (
            <div className="bg-white border border-ivory-200 rounded-xl p-12 text-center text-ivory-400">
              <Cpu className="w-10 h-10 mx-auto text-[#866854] mb-3 opacity-30" />
              <h3 className="text-sm font-semibold text-ivory-800">No active models loaded</h3>
              <p className="text-xs text-ivory-500 mt-1 max-w-sm mx-auto">
                Start your runtime backend or configure local endpoints under Settings to load model credentials.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="bg-white border border-ivory-200 rounded-xl p-5 shadow-soft hover:shadow-soft-lg hover:border-ivory-300 transition-all duration-200 flex flex-col gap-4"
                >
                  {/* Model Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-ivory-100 font-semibold px-2 py-0.5 rounded text-ivory-600 uppercase font-sans">
                          {model.provider}
                        </span>
                        <h3 className="text-sm font-bold text-ivory-800">{model.displayName}</h3>
                      </div>
                      <p className="text-xs text-ivory-500 mt-1">{model.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-[#866854]">{formatTokens(model.contextWindow)} ctx</div>
                      <div className="text-[10px] text-ivory-400 mt-0.5">out limit: {formatTokens(model.maxOutputTokens)}</div>
                    </div>
                  </div>

                  {/* Capability Badges */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-ivory-100 pt-3">
                    <span className="text-[10px] text-ivory-500 font-semibold uppercase tracking-wider font-sans mr-2">Features:</span>
                    {model.supportsTools && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-2 py-0.5 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> Tool Use
                      </span>
                    )}
                    {model.supportsVision && (
                      <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-100 rounded px-2 py-0.5 font-semibold flex items-center gap-1">
                        <Layers className="w-3 h-3 text-sky-600" /> Vision
                      </span>
                    )}
                    {model.supportsStreaming && (
                      <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 rounded px-2 py-0.5 font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-600" /> Streaming
                      </span>
                    )}
                    <div className="ml-auto text-[10px] text-ivory-500 italic">
                      Best for: <strong className="font-semibold text-ivory-700">{model.bestFor}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
