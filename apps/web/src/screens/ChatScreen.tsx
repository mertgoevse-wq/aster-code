import { useState } from 'react';
import { Send, Terminal, Play, CheckCircle, FileCode, Sparkles, MessageSquare, AlertTriangle } from 'lucide-react';
import { ChatMessage, AgentActivityStep } from '@aster-code/shared';

interface ChatScreenProps {
  selectedModelId: string;
  runtimeConnected: boolean;
}

export default function ChatScreen({ selectedModelId, runtimeConnected }: ChatScreenProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Aster agent. How can I help you build, test, or design today?',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [activity, setActivity] = useState<AgentActivityStep[]>([
    {
      id: 'step-1',
      timestamp: new Date(Date.now() - 58000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'success',
      title: 'Workspace Loaded',
      message: 'Workspace c:/Users/mertg/aster-code verified successfully.',
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    // Simulate Agent Steps timeline
    const mockSteps: Array<Omit<AgentActivityStep, 'id' | 'timestamp'>> = [
      {
        type: 'thought',
        title: 'Analyzing workspace',
        message: 'Searching project index files for components matching request.',
      },
      {
        type: 'tool_call',
        title: 'Reading directory',
        message: 'mcp::list_dir(Cwd: "/workspace")',
      },
      {
        type: 'tool_call',
        title: 'Running test checker',
        message: 'bash::run_command("npm run typecheck")',
      },
      {
        type: 'success',
        title: 'Checks complete',
        message: 'Compilation verified with zero errors.',
      }
    ];

    let currentStep = 0;
    const runSimulation = () => {
      if (currentStep < mockSteps.length) {
        const step = mockSteps[currentStep];
        setActivity(prev => [
          ...prev,
          {
            ...step,
            id: `step-${Date.now()}-${currentStep}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        currentStep++;
        setTimeout(runSimulation, 1000);
      } else {
        // Append response
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: `I have analyzed your request. As the runtime server integration is currently in dry-run mode (MVP 0.1), I have checked the system configurations and everything looks set to build. Let me know when you'd like to integrate real LLM adapters!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: selectedModelId
          }
        ]);
        setIsProcessing(false);
      }
    };

    setTimeout(runSimulation, 500);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Messages Column */}
      <div className="flex-1 flex flex-col justify-between bg-ivory-50 h-full">
        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto px-12 py-8 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar placeholder */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 select-none ${
                msg.role === 'user' ? 'bg-clay text-white' : 'bg-ivory-200 text-ivory-800'
              }`}>
                {msg.role === 'user' ? 'U' : 'A'}
              </div>

              {/* Message text block */}
              <div>
                <div className={`px-4.5 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-soft border ${
                  msg.role === 'user'
                    ? 'bg-[#866854] text-white border-clay-dark rounded-tr-none'
                    : 'bg-white text-ivory-800 border-ivory-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                
                {/* Message sub-meta */}
                <div className={`text-[10px] text-ivory-400 mt-1 flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[9px]">{msg.modelUsed}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input panel */}
        <div className="p-8 border-t border-ivory-200 bg-white">
          <div className="max-w-3xl mx-auto relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={runtimeConnected ? "Ask agent to review workspace or generate features..." : "Start runtime server to write prompt..."}
              disabled={!runtimeConnected}
              className="w-full bg-ivory-50 border border-ivory-200 rounded-xl py-3.5 pl-4 pr-14 text-sm focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay/20 resize-none h-14 max-h-32 disabled:bg-ivory-100/50 disabled:cursor-not-allowed text-ivory-800 placeholder-ivory-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing || !runtimeConnected}
              className="absolute right-3 bg-[#866854] hover:bg-[#725441] disabled:bg-ivory-300 text-white p-2.5 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-clay/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-center text-ivory-400 mt-2.5">
            Aster Code executes commands in a secure background runtime. Review and verify code suggestions carefully.
          </div>
        </div>
      </div>

      {/* Agent Activity Panel */}
      <div className="w-80 border-l border-ivory-200 bg-[#FAF9F6] h-full flex flex-col">
        <div className="p-4 border-b border-ivory-200 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-ivory-500 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            Agent Activity log
          </h3>
          {isProcessing && (
            <span className="w-1.5 h-1.5 rounded-full bg-clay animate-ping" />
          )}
        </div>

        {/* Steps Stack */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activity.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ivory-400">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-[#866854]" />
              <p className="text-xs">No active runs. Chat with the agent to start editing files.</p>
            </div>
          ) : (
            activity.map((step) => {
              const getIcon = () => {
                switch (step.type) {
                  case 'thought':
                    return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
                  case 'tool_call':
                    return <Play className="w-3.5 h-3.5 text-blue-500" />;
                  case 'success':
                    return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
                  case 'error':
                    return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
                  default:
                    return <FileCode className="w-3.5 h-3.5 text-ivory-500" />;
                }
              };

              return (
                <div key={step.id} className="p-3 bg-white rounded-lg border border-ivory-200/80 shadow-soft-sm flex gap-3 text-xs leading-relaxed">
                  <div className="mt-0.5">{getIcon()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-semibold text-ivory-800 truncate">{step.title}</span>
                      <span className="text-[9px] text-ivory-400 font-mono shrink-0">{step.timestamp}</span>
                    </div>
                    <p className="text-ivory-500 font-mono text-[10px] break-all">{step.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
