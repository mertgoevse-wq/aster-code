import { useState, useRef, useEffect } from 'react';
import { Send, X, Star } from 'lucide-react';
import { ChatMessage, AgentEvent, AgentPlan, AgentSessionInfo, AgentTaskType, RoutingResult } from '@aster-code/shared';
import AgentActivityFeed from '../components/AgentActivityFeed.tsx';
import AgentPlanPanel from '../components/AgentPlanPanel.tsx';
import AgentRoutingPreview from '../components/AgentRoutingPreview.tsx';
import { getSelectedPromptId, setSelectedPromptId, getPromptById } from './SettingsScreen.tsx';
import { apiFetch } from '../api.ts';

interface ChatScreenProps {
  selectedModelId: string;
  runtimeConnected: boolean;
}

export default function ChatScreen({ selectedModelId: _selectedModelId, runtimeConnected }: ChatScreenProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Aster agent. I operate under a strict approval-gated loop — I will plan before acting, and you must approve edits or commands before they execute. How can I help you today?',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Agent session state
  const [session, setSession] = useState<AgentSessionInfo | null>(null);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [taskType, setTaskType] = useState<AgentTaskType | null>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [phase, setPhase] = useState<'idle' | 'classifying' | 'plan-review' | 'executing' | 'done'>('idle');

  // Active system prompt — polled on visibility change for in-app tab switches
  const [activePrompt, setActivePrompt] = useState<{ id: string; title: string } | null>(() => {
    const id = getSelectedPromptId();
    if (!id) return null;
    const p = getPromptById(id);
    return p ? { id: p.id, title: p.title } : null;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for prompt changes when tab becomes visible (covers in-app tab switches)
  useEffect(() => {
    const refreshPrompt = () => {
      const id = getSelectedPromptId();
      if (!id) {
        setActivePrompt(null);
        return;
      }
      const p = getPromptById(id);
      setActivePrompt(p ? { id: p.id, title: p.title } : null);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshPrompt();
    };
    const onStorage = () => refreshPrompt(); // cross-tab

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing || !runtimeConnected) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    const taskText = input.trim();
    setInput('');
    setIsProcessing(true);
    setEvents([]);
    setPlan(null);
    setTaskType(null);
    setRouting(null);

    try {
      // Phase 1: Create session
      setPhase('classifying');

      const sessionRes = await apiFetch('/api/agent/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskText }),
      });

      if (!sessionRes.ok) {
        throw new Error(`Session creation failed: ${sessionRes.status}`);
      }

      const sessionData = await sessionRes.json();
      const newSession: AgentSessionInfo = sessionData.session;
      setSession(newSession);

      // Add planning message
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-planning-${Date.now()}`,
          role: 'assistant',
          content: `📋 Created session \`${newSession.id}\`. Analyzing your task and generating a safe execution plan...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

      // Phase 2: Generate plan
      const planRes = await apiFetch(`/api/agent/session/${newSession.id}/plan`, {
        method: 'POST',
      });

      if (!planRes.ok) {
        throw new Error(`Plan generation failed: ${planRes.status}`);
      }

      const planData = await planRes.json();
      const generatedPlan: AgentPlan = planData.plan;
      const classification = planData.classification;
      const routingResult: RoutingResult = planData.routing;

      setPlan(generatedPlan);
      setTaskType(classification.taskType);
      setRouting(routingResult);
      setPhase('plan-review');

      // Show the routing analysis in chat
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-plan-${Date.now()}`,
          role: 'assistant',
          content: `✅ Detected **${routingResult.intents.length} intent(s)** and matched **${routingResult.selectedSkills.length} skill(s)**. ${routingResult.summary}\n\n**Please review the plan below and approve or reject it.**`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

    } catch (err: any) {
      console.error('Agent session error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Error: ${err.message || 'Failed to process your request. Is the runtime server running on port 3001?'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setPhase('idle');
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!session || !plan) return;

    setIsProcessing(true);
    setPhase('executing');

    setMessages(prev => [
      ...prev,
      {
        id: `assistant-executing-${Date.now()}`,
        role: 'assistant',
        content: '⚡ Plan approved! Executing steps sequentially (MVP: simulated execution — no real file edits or commands).',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);

    try {
      const approveRes = await apiFetch(`/api/agent/session/${session.id}/approve`, {
        method: 'POST',
      });

      if (!approveRes.ok) {
        const errData = await approveRes.json().catch(() => ({}));
        throw new Error((errData as any).error || `Approval failed: ${approveRes.status}`);
      }

      const approveData = await approveRes.json();
      const execEvents: AgentEvent[] = approveData.events;
      setEvents(execEvents);
      setPlan(approveData.plan);
      setPhase('done');
      setIsProcessing(false);

      setMessages(prev => [
        ...prev,
        {
          id: `assistant-done-${Date.now()}`,
          role: 'assistant',
          content: `✅ Execution complete! ${execEvents.filter((e: AgentEvent) => e.status === 'done').length} steps completed successfully. Check the activity feed for details.\n\n⚠️ **Note:** This is the MVP safe agent loop. File writes and shell commands are simulated — no real files were modified.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);

    } catch (err: any) {
      console.error('Execution error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: `❌ Execution error: ${err.message || 'Unknown error during execution.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setPhase('idle');
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!session) return;

    setIsProcessing(true);

    try {
      await apiFetch(`/api/agent/session/${session.id}/reject`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Reject API call failed:', err);
    }

    setPhase('idle');
    setIsProcessing(false);

    setMessages(prev => [
      ...prev,
      {
        id: `assistant-rejected-${Date.now()}`,
        role: 'assistant',
        content: 'Plan rejected. No actions were taken. Feel free to send a revised task.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Messages Column */}
      <div className="flex-1 flex flex-col justify-between bg-ivory-50 h-full min-w-0">
        {/* Active prompt badge */}
        {activePrompt && (
          <div className="px-8 pt-4 pb-0">
            <div className="max-w-3xl mx-auto flex items-center gap-2 bg-clay/5 border border-clay/20 rounded-lg px-3 py-1.5 text-[11px]">
              <Star className="w-3 h-3 text-clay fill-clay" />
              <span className="text-clay font-medium">System Prompt:</span>
              <span className="text-ivory-600 truncate">{activePrompt.title}</span>
              <button
                onClick={() => {
                  setSelectedPromptId(null);
                  setActivePrompt(null);
                }}
                className="ml-auto text-ivory-400 hover:text-rose-500 shrink-0"
                title="Clear system prompt"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
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
                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-soft border ${
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

          {/* Inline routing preview */}
          {routing && phase === 'plan-review' && (
            <div className="max-w-3xl pl-12 mb-4">
              <AgentRoutingPreview routing={routing} />
            </div>
          )}

          {/* Inline plan panel when in review phase */}
          {plan && phase === 'plan-review' && (
            <div className="max-w-3xl pl-12">
              <AgentPlanPanel
                plan={plan}
                taskType={taskType || 'edit-code'}
                onApprove={handleApprove}
                onReject={handleReject}
                isProcessing={isProcessing}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input panel */}
        <div className="p-6 border-t border-ivory-200 bg-white">
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
              placeholder={runtimeConnected ? "Describe your task (e.g., 'add a dark mode toggle' or 'fix the build error')..." : "Start runtime server to use the agent..."}
              disabled={!runtimeConnected || isProcessing}
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
            {plan ? 'Plan created. Approve or reject before execution.' : 'Aster Code uses an approval-gated agent loop. No autonomous file edits or commands.'}
          </div>
        </div>
      </div>

      {/* Agent Activity Panel */}
      <div className="w-80 border-l border-ivory-200 bg-[#FAF9F6] h-full flex flex-col shrink-0">
        <AgentActivityFeed
          events={events}
          isExecuting={phase === 'executing' || phase === 'classifying'}
        />
      </div>
    </div>
  );
}
