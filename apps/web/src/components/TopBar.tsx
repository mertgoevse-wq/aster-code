import { Cpu, RefreshCw, AlertTriangle } from 'lucide-react';
import { ModelMetadata } from '@aster-code/shared';

interface TopBarProps {
  title: string;
  models: ModelMetadata[];
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  runtimeConnected: boolean;
  onRefreshModels: () => void;
  isRefreshing: boolean;
}

export default function TopBar({
  title,
  models,
  selectedModelId,
  setSelectedModelId,
  runtimeConnected,
  onRefreshModels,
  isRefreshing
}: TopBarProps) {

  return (
    <header className="h-16 border-b border-ivory-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 z-10 shrink-0">
      {/* Title / Breadcrumb */}
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ivory-800 uppercase tracking-widest text-[11px] font-sans">
          Studio / <span className="text-[#866854] font-medium font-serif capitalize text-sm tracking-normal font-bold">{title}</span>
        </h2>
      </div>

      {/* Model Selector & Connection Settings */}
      <div className="flex items-center gap-4">
        {/* Model Picker */}
        {runtimeConnected ? (
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-ivory-500" />
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="text-xs bg-ivory-100/70 border border-ivory-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-clay/60 focus:ring-1 focus:ring-clay/20 font-medium text-ivory-800"
            >
              {models.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                models.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} ({m.provider})
                  </option>
                ))
              )}
            </select>

            <button
              onClick={onRefreshModels}
              disabled={isRefreshing}
              className={`p-1.5 hover:bg-ivory-100 rounded-lg text-ivory-500 hover:text-[#866854] border border-transparent hover:border-ivory-200 transition-all ${
                isRefreshing ? 'animate-spin text-clay' : ''
              }`}
              title="Refresh provider models"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Connection offline. Features locked.</span>
          </div>
        )}
      </div>
    </header>
  );
}
