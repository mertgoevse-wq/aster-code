import React from 'react';

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ivory-50 select-none">
      {/* Navigation Sidebar */}
      {sidebar}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Header Toolbar */}
        {topbar}

        {/* Content Box */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
}
