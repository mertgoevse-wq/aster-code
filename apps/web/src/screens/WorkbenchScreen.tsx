import { useState } from 'react';
import { Folder, File, Terminal as TermIcon, Monitor, Eye, FileText, ChevronDown } from 'lucide-react';

interface WorkbenchScreenProps {
  runtimeConnected: boolean;
}

export default function WorkbenchScreen({ runtimeConnected }: WorkbenchScreenProps) {
  const [activeFile, setActiveFile] = useState('src/App.tsx');

  const fileTree = [
    { name: 'apps', type: 'dir', path: 'apps' },
    { name: 'web', type: 'dir', path: 'apps/web' },
    { name: 'src', type: 'dir', path: 'src', indent: 1 },
    { name: 'components', type: 'dir', path: 'src/components', indent: 2 },
    { name: 'AppShell.tsx', type: 'file', path: 'src/components/AppShell.tsx', indent: 3 },
    { name: 'Sidebar.tsx', type: 'file', path: 'src/components/Sidebar.tsx', indent: 3 },
    { name: 'App.tsx', type: 'file', path: 'src/App.tsx', indent: 2 },
    { name: 'main.tsx', type: 'file', path: 'src/main.tsx', indent: 2 },
    { name: 'index.html', type: 'file', path: 'index.html', indent: 1 },
    { name: 'package.json', type: 'file', path: 'package.json', indent: 1 },
  ];

  const fileContents: Record<string, string> = {
    'src/components/AppShell.tsx': `import React from 'react';\n\nexport default function AppShell({ children }) {\n  return (\n    <div className="min-h-screen bg-ivory-50 flex">\n      {children}\n    </div>\n  );\n}`,
    'src/components/Sidebar.tsx': `import React from 'react';\n\nexport default function Sidebar() {\n  return <aside className="w-64 bg-white border-r">Sidebar</aside>;\n}`,
    'src/App.tsx': `import React from 'react';\nimport AppShell from './components/AppShell';\n\nexport default function App() {\n  return (\n    <AppShell>\n      <main className="p-8">\n        <h1 className="text-3xl font-serif font-bold">Hello Aster</h1>\n      </main>\n    </AppShell>\n  );\n}`,
    'src/main.tsx': `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
    'index.html': `<!DOCTYPE html>\n<html>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>`,
    'package.json': `{\n  "name": "aster-code-web",\n  "version": "0.1.0",\n  "dependencies": {\n    "react": "^18.3.1"\n  }\n}`
  };

  return (
    <div className="flex h-full w-full bg-ivory-50 overflow-hidden relative">
      {/* Offline Mask */}
      {!runtimeConnected && (
        <div className="absolute inset-0 bg-ivory-100/60 backdrop-blur-[1.5px] z-50 flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="p-4 bg-white rounded-2xl border border-ivory-200 shadow-soft max-w-sm">
            <Monitor className="w-8 h-8 mx-auto text-[#866854] mb-3 opacity-60" />
            <h3 className="text-sm font-semibold text-ivory-800 mb-1">Runtime Not Connected Yet</h3>
            <p className="text-xs text-ivory-500 mb-4">
              Connect to the local server or start the Express runtime backend on port 3001 to enable workbench edits and previews.
            </p>
            <div className="text-[10px] text-ivory-400 font-mono bg-ivory-50 px-2 py-1.5 rounded-lg border border-ivory-200/60">
              node apps/runtime/dist/server.js
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Explorer */}
      <div className="w-60 border-r border-ivory-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-ivory-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans">Workspace files</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
          {fileTree.map((item) => {
            const isDir = item.type === 'dir';
            const indentStyle = item.indent ? { paddingLeft: `${item.indent * 12}px` } : {};
            
            return (
              <button
                key={item.path}
                onClick={() => {
                  if (!isDir) setActiveFile(item.path);
                }}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFile === item.path && !isDir
                    ? 'bg-ivory-100/80 text-ivory-900 font-semibold'
                    : 'text-ivory-600 hover:bg-ivory-50'
                }`}
                style={indentStyle}
              >
                {isDir ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-ivory-400" />
                    <Folder className="w-3.5 h-3.5 text-[#866854]/80 shrink-0" />
                  </>
                ) : (
                  <>
                    <span className="w-3.5 h-3.5" />
                    <File className="w-3.5 h-3.5 text-ivory-400 shrink-0" />
                  </>
                )}
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Terminal (Left) / Live Preview (Right) Split */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-white border-b border-ivory-200">
          <div className="h-10 bg-ivory-50/50 border-b border-ivory-200 flex items-center px-4 justify-between">
            <div className="flex items-center gap-1.5 text-xs text-ivory-500">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px] font-medium text-ivory-700">{activeFile}</span>
            </div>
            <span className="text-[10px] bg-ivory-200/70 border border-ivory-300/40 rounded px-1.5 py-0.5 text-ivory-600 font-mono">TypeScript React</span>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-[#FAF9F6] font-mono text-xs leading-relaxed text-ivory-700 whitespace-pre">
            {fileContents[activeFile] || `// No content loaded.`}
          </div>
        </div>

        {/* Terminal Area */}
        <div className="h-44 bg-ivory-900 text-ivory-100 flex flex-col shrink-0 font-mono">
          <div className="h-8 bg-ivory-950 border-b border-ivory-800 flex items-center justify-between px-4 text-xs font-semibold text-ivory-400">
            <span className="flex items-center gap-2">
              <TermIcon className="w-3.5 h-3.5" />
              Terminal / Execution console
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-[11px] leading-normal text-emerald-400 space-y-1 select-text">
            <div>$ npm run dev</div>
            <div className="text-ivory-400">&gt; aster-code-web@0.1.0 dev</div>
            <div className="text-ivory-400">&gt; vite</div>
            <div>[vite] Local:   http://localhost:5173/</div>
            <div>[vite] Network: use --host to expose</div>
            <div>[vite] HMR connection open. Ready.</div>
          </div>
        </div>
      </div>

      {/* Preview Column (Right) */}
      <div className="w-96 border-l border-ivory-200 bg-white flex flex-col shrink-0">
        <div className="h-10 border-b border-ivory-200 bg-ivory-50/50 flex items-center px-4 justify-between">
          <span className="text-xs font-semibold text-ivory-500 uppercase tracking-wider font-sans flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Live Preview
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Port 5173
          </span>
        </div>

        {/* Mock Preview Page */}
        <div className="flex-1 p-6 bg-ivory-100/40 overflow-y-auto flex items-center justify-center">
          <div className="w-full bg-white border border-ivory-200 rounded-xl shadow-soft p-6 text-center">
            <div className="w-12 h-12 bg-ivory-100 rounded-full flex items-center justify-center mx-auto text-[#866854] font-bold text-lg mb-4">
              A
            </div>
            <h1 className="font-serif text-xl font-bold text-ivory-800 mb-1">Hello Aster</h1>
            <p className="text-xs text-ivory-500 mb-6">Welcome to your coding agent sandbox. Try making changes to App.tsx in the editor.</p>
            <div className="border-t border-ivory-100 pt-4 flex justify-between text-[10px] text-ivory-400 font-medium">
              <span>Status: Active</span>
              <span>Latency: 14ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
