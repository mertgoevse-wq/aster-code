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

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [runtimeConnected, setRuntimeConnected] = useState(false);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);

  // Check backend server connection
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setRuntimeConnected(true);
        return true;
      }
    } catch (e) {
      // offline
    }
    setRuntimeConnected(false);
    return false;
  };

  const fetchRegistryData = async () => {
    try {
      const [modelsRes, providersRes] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/providers')
      ]);

      if (modelsRes.ok && providersRes.ok) {
        const mData = await modelsRes.json();
        const pData = await providersRes.json();

        if (mData.success) {
          setModels(mData.models);
          setLastRefreshTime(mData.lastRefreshAt);
          // Set default selected model
          if (mData.models.length > 0 && !selectedModelId) {
            setSelectedModelId(mData.models[0].id);
          }
        }

        if (pData.success) {
          setProviders(pData.providers);
        }
      }
    } catch (err) {
      console.error('Failed to load model registry endpoints:', err);
    }
  };

  const handleRefreshModels = async () => {
    if (!runtimeConnected) return;
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/models/refresh', { method: 'POST' });
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
    } catch (e) {
      console.error('Model refresh request failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateConfigs = async (configs: ProviderConfigs): Promise<boolean> => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configs)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Re-load models list and provider configurables
          await fetchRegistryData();
          return true;
        }
      }
    } catch (err) {
      console.error('Configuration update request failed:', err);
    }
    return false;
  };

  // Monitor connection states
  useEffect(() => {
    const init = async () => {
      const connected = await checkHealth();
      if (connected) {
        await fetchRegistryData();
      }
    };
    init();

    // Check health every 8 seconds
    const interval = setInterval(async () => {
      const connected = await checkHealth();
      if (connected && models.length === 0) {
        await fetchRegistryData();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [models.length]);

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
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
          runtimeConnected={runtimeConnected}
          onRefreshModels={handleRefreshModels}
          isRefreshing={isRefreshing}
        />
      }
    >
      {renderActiveScreen()}
    </AppShell>
  );
}
