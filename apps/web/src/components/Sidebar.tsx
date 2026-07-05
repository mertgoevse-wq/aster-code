import { MessageSquare, Columns, Cpu, Award, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  runtimeConnected: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, runtimeConnected }: SidebarProps) {
  const navItems = [
    { id: 'chat', name: 'Chat Studio', icon: MessageSquare },
    { id: 'workbench', name: 'Workbench', icon: Columns },
    { id: 'models', name: 'Model Registry', icon: Cpu },
    { id: 'skills', name: 'Agent Skills', icon: Award },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#F5F2EC] border-r border-ivory-300 flex flex-col justify-between h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-ivory-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#866854] flex items-center justify-center text-white font-serif text-lg font-bold shadow-soft">
            A
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold leading-none text-ivory-900 tracking-tight">Aster Code</h1>
            <span className="text-[10px] uppercase tracking-widest text-ivory-500 font-semibold font-sans">Agent Studio</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-ivory-900 shadow-soft border border-ivory-200/60 font-semibold'
                  : 'text-ivory-600 hover:text-ivory-900 hover:bg-ivory-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#866854]' : 'text-ivory-500'}`} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Connection status footer */}
      <div className="p-4 border-t border-ivory-300 bg-ivory-100/50">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className={`w-2.5 h-2.5 rounded-full ${runtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ivory-800">
              {runtimeConnected ? 'Runtime Server' : 'Runtime Offline'}
            </p>
            <p className="text-[10px] text-ivory-500 truncate">
              {runtimeConnected ? 'http://localhost:3001' : 'Not connected'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
