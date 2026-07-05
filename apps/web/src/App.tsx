import { useState, useEffect } from 'react';
import AppShell from './components/AppShell.tsx';
import Sidebar from './components/Sidebar.tsx';
import TopBar from './components/TopBar.tsx';
import ChatScreen from './screens/ChatScreen.tsx';
import WorkbenchScreen from './screens/WorkbenchScreen.tsx';
import ModelsScreen from './screens/ModelsScreen.tsx';
import SkillsScreen from './screens/SkillsScreen.tsx';
import SettingsScreen from './screens/SettingsScreen.tsx';
import { ModelMetadata, ProviderInfo, ProviderConfigs } from '@aster-code/shared';
import { apiFetch } from './api.ts';

interface CacheStatus {
  isRefreshing: boolean;
  lastCheckedAt: string | null;
  cacheTTLMs: number;
  cacheSize: number;
  providerStatus: Record<string, { status: string; latencyMs?: number }>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [runtimeConnected, setRuntimeConnected] = useState(false);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  // Auto-refresh config
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    return localStorage.getItem('aster_auto_refresh') !== 'false';
  });
  const [autoRefreshIntervalS, setAutoRefreshIntervalS] = useState(() => {
    const saved = localStorage.getItem('aster_auto_refresh_interval');
    return saved ? parseInt(saved, 10) : 300;
  });

  // Cache status
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);

  // Track Electron runtime status
  const [electronRuntimeState, setElectronRuntimeState] = useState<'starting' | 'online' | 'offline' | 'error' | null>(null);

  // Check backend server connection
  const checkHealth = async () => {
    try {
      const res = await apiFetch('/api/health');
      if (res.ok) {
        setRuntimeConnected(true);
        return true;
      }
    } catch { /* offline */ }
    setRuntimeConnected(false);
    return false;
  };

  const fetchRegistryData = async () => {
    try {
      const [modelsRes, providersRes] = await Promise.all([
        apiFetch('/api/models'),
        apiFetch('/api/providers')
      ]);

      if (modelsRes.ok && providersRes.ok) {
        const mData = await modelsRes.json();
        const pData = await providersRes.json();

        if (mData.success) {
          setModels(mData.models);
          setLastRefreshTime(mData.lastRefreshAt);
          if (mData.models.length > 0 && !selectedModelId) {
            setSelectedModelId(mData.models[0].id);
          }
        }
        if (pData.success) setProviders(pData.providers);
      }
    } catch (err) {
      console.error('Failed to load model registry endpoints:', err);
    }
  };

  const fetchCacheStatus = async () => {
    try {
      const res = await apiFetch('/api/models/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status) {
          setCacheStatus({
            isRefreshing: data.status.isRefreshing,
            lastCheckedAt: data.status.lastCheckedAt,
            cacheTTLMs: data.status.cacheTTLMs,
            cacheSize: data.status.cacheSize,
            providerStatus: data.status.providerStatus || {}
          });
        }
      }
    } catch { /* non-critical */ }
  };

  const handleRefreshModels = async () => {
    if (!runtimeConnected) return;
    setIsRefreshing(true);
    try {
      const res = await apiFetch('/api/models/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setModels(data.models);
          setLastRefreshTime(data.lastRefreshAt);
          if (data.models.length > 0 && !selectedModelId) {
            setSelectedModelId(data.models[0].id);
          }
        }
      }
      await fetchCacheStatus();
    } catch (e) {
      console.error('Model refresh request failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateConfigs = async (configs: ProviderConfigs): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchRegistryData();
          return true;
        }
      }
    } catch (err) {
      console.error('Configuration update request failed:', err);
    }
    return false;
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefreshEnabled(enabled);
    localStorage.setItem('aster_auto_refresh', String(enabled));
  };

  const handleAutoRefreshInterval = (seconds: number) => {
    setAutoRefreshIntervalS(seconds);
    localStorage.setItem('aster_auto_refresh_interval', String(seconds));
  };

  // Listen for Electron runtime status changes
  useEffect(() => {
    const desktop = (window as any).asterDesktop;
    if (!desktop?.onRuntimeStatusChange) return;

    // Get initial status
    desktop.getRuntimeStatus().then((status: any) => {
      setElectronRuntimeState(status.state);
      if (status.state === 'online') setRuntimeConnected(true);
    });

    const unsubscribe = desktop.onRuntimeStatusChange((status: any) => {
      setElectronRuntimeState(status.state);
      if (status.state === 'online') setRuntimeConnected(true);
      if (status.state === 'offline' || status.state === 'error') setRuntimeConnected(false);
    });

    return unsubscribe;
  }, []);

  // Monitor connection states
  useEffect(() => {
    const init = async () => {
      const connected = await checkHealth();
      if (connected) {
        await fetchRegistryData();
        await fetchCacheStatus();
      }
    };
    init();

    const interval = setInterval(async () => {
      const connected = await checkHealth();
      if (connected) {
        if (models.length === 0) await fetchRegistryData();
        await fetchCacheStatus();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [models.length]);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefreshEnabled || !runtimeConnected) return;
    const timer = setInterval(() => {
      handleRefreshModels();
    }, autoRefreshIntervalS * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled, autoRefreshIntervalS, runtimeConnected]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatScreen selectedModelId={selectedModelId} runtimeConnected={runtimeConnected} />;
      case 'workbench':
        return <WorkbenchScreen runtimeConnected={runtimeConnected} />;
      case 'models':
        return (
          <ModelsScreen
            models={models}
            providers={providers}
            onRefreshModels={handleRefreshModels}
            isRefreshing={isRefreshing}
            lastRefreshTime={lastRefreshTime}
            runtimeConnected={runtimeConnected}
          />
        );
      case 'skills':
        return <SkillsScreen />;
      case 'settings':
        return <SettingsScreen runtimeConnected={runtimeConnected} onUpdateConfigs={handleUpdateConfigs} />;
      default:
        return <ChatScreen selectedModelId={selectedModelId} runtimeConnected={runtimeConnected} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat': return 'Chat Studio';
      case 'workbench': return 'Workbench';
      case 'models': return 'Model Registry';
      case 'skills': return 'Agent Skills';
      case 'settings': return 'Settings';
      default: return 'Studio';
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          runtimeConnected={runtimeConnected}
        />
      }
      topbar={
        <TopBar
          title={getTabTitle()}
          models={models}
          providers={providers}
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
          runtimeConnected={runtimeConnected}
          onRefreshModels={handleRefreshModels}
          isRefreshing={isRefreshing}
          lastRefreshTime={lastRefreshTime}
          cacheStatus={cacheStatus}
          autoRefreshEnabled={autoRefreshEnabled}
          autoRefreshIntervalS={autoRefreshIntervalS}
          onAutoRefreshToggle={handleAutoRefreshToggle}
          onAutoRefreshInterval={handleAutoRefreshInterval}
        />
      }
      statusbar={
        <div className="h-7 border-t border-ivory-200 bg-ivory-100/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3 text-[10px] text-ivory-500 font-mono">                <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${electronRuntimeState === 'starting' ? 'bg-blue-400 animate-pulse' : runtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {electronRuntimeState === 'starting' ? 'runtime starting...' : runtimeConnected ? 'localhost:3001' : 'offline'}
            </span>
            <span className="text-ivory-300">|</span>
            <span>{models.length} models</span>
            <span className="text-ivory-300">|</span>
            <span>local-first</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-ivory-400 font-sans">
            {electronRuntimeState && (
              <span className={`px-1.5 py-0.5 rounded border font-semibold ${
                electronRuntimeState === 'starting' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                electronRuntimeState === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                electronRuntimeState === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-ivory-100 text-ivory-500 border-ivory-200'
              }`}>
                {electronRuntimeState === 'starting' && '⚡ Starting Runtime'}
                {electronRuntimeState === 'online' && '✓ Runtime Online'}
                {electronRuntimeState === 'error' && '✕ Runtime Error'}
                {electronRuntimeState === 'offline' && 'Runtime Offline'}
              </span>
            )}
            <span className="bg-clay/10 text-clay px-1.5 py-0.5 rounded border border-clay/20 font-semibold">{electronRuntimeState ? 'Desktop Build' : 'Desktop Dev Build'}</span>
          </div>
        </div>
      }
    >
      {renderActiveScreen()}
    </AppShell>
  );
}
