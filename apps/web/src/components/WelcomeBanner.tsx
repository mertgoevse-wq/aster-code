import { useState } from 'react';
import {
  Zap, CheckCircle2, Clock, ArrowRight,
  MessageSquare, Play, Award,
  Server, Shield, Lightbulb, Sparkles, Wrench
} from 'lucide-react';
import { storage } from '../lib/storage.ts';

const DISMISSED_KEY = 'welcome-dismissed';

export function hasDismissedWelcome(): boolean {
  return storage.get(DISMISSED_KEY, '') === 'true';
}

export function dismissWelcome(): void {
  storage.set(DISMISSED_KEY, 'true');
}

export function resetWelcome(): void {
  storage.remove(DISMISSED_KEY);
}

interface WelcomeBannerProps {
  runtimeConnected: boolean;
  onTryPrompt: (prompt: string) => void;
  modelCount?: number;
  skillCount?: number;
}

export default function WelcomeBanner({ runtimeConnected, onTryPrompt, modelCount = 0, skillCount = 0 }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(!hasDismissedWelcome());

  const handleDismiss = () => {
    dismissWelcome();
    setVisible(false);
  };

  if (!visible) return null;

  const suggestedPrompts = [
    { label: 'Explain this project', prompt: 'explain this project', icon: Lightbulb },
    { label: 'Create a hello world app', prompt: 'create a hello world app', icon: Play },
    { label: 'Add dark mode toggle', prompt: 'add a dark mode toggle to the settings', icon: Wrench },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-ivory-50">
      <div className="max-w-2xl mx-auto py-10 px-8 space-y-6">
        {/* ================================================================
            HERO: FIRST-RUN WELCOME
            ================================================================ */}
        <div className="bg-white border border-ivory-200 rounded-2xl shadow-soft p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#866854] flex items-center justify-center text-white font-serif text-2xl font-bold shadow-soft mx-auto">
            A
          </div>
          <h1 className="font-serif text-2xl font-bold text-ivory-900">
            Welcome to Aster Code
          </h1>
          <p className="text-sm text-ivory-500 max-w-md mx-auto leading-relaxed">
            A calm, Claude-inspired coding-agent studio. Your AI assistant that plans
            before acting — every file edit and command must be approved before execution.
            <strong> No autonomous actions. No surprises.</strong>
          </p>

          {/* Runtime status callout */}
          <div className="flex flex-col items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
              runtimeConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${runtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {runtimeConnected
                ? 'Runtime server online — localhost:3001'
                : 'Runtime server offline — start with npm run dev:runtime'
              }
            </div>
            {runtimeConnected && (
              <div className="flex gap-4 text-xs text-ivory-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {modelCount > 0 ? `${modelCount} models` : 'No models'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {skillCount > 0 ? `${skillCount} skills` : 'No skills'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================
            TWO-COLUMN: WHAT WORKS NOW + COMING NEXT
            ================================================================ */}
        <div className="grid grid-cols-2 gap-5">
          {/* What Works Now */}
          <div className="bg-white border border-emerald-200/60 rounded-2xl shadow-soft p-6 space-y-4">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              What Works Now
            </h2>
            <ul className="space-y-2.5">
              {[
                { label: 'Desktop shell', desc: 'Electron window, auto-start runtime' },
                { label: 'Runtime server', desc: 'Express API on localhost:3001, SSE events' },
                { label: 'Agent plan generation', desc: 'Classifies tasks, builds safe execution plans' },
                { label: 'Skill routing', desc: 'Matches intent to 8 built-in agent skills' },
                { label: 'Workbench UI', desc: 'File tree, editor, terminal & preview panels' },
                { label: 'Model registry', desc: 'Mock adapter foundation for 5 providers' },
                { label: 'System prompt library', desc: 'Create, edit, and manage AI prompt templates' },
              ].map(item => (
                <li key={item.label} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-ivory-800">{item.label}</span>
                    <p className="text-[10px] text-ivory-400 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Coming Next */}
          <div className="bg-white border border-amber-200/60 rounded-2xl shadow-soft p-6 space-y-4">
            <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-amber-600" />
              Coming Next
            </h2>
            <ul className="space-y-2.5">
              {[
                { label: 'Real LLM chat', desc: 'Connect providers, send prompts, stream responses' },
                { label: 'Real file edits', desc: 'Actual code changes with diff previews' },
                { label: 'Real command execution', desc: 'Run approved commands in terminal' },
                { label: 'Real MCP connections', desc: 'Connect to MCP servers for tool access' },
                { label: 'Persistent sessions', desc: 'Save & resume agent sessions across restarts' },
                { label: 'OAuth completion', desc: 'GitHub/Google login, cloud sync, remote projects' },
              ].map(item => (
                <li key={item.label} className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-ivory-800">{item.label}</span>
                    <p className="text-[10px] text-ivory-400 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ================================================================
            STUBBED FEATURES INDICATOR
            ================================================================ */}
        <div className="bg-white border border-ivory-200 rounded-2xl shadow-soft p-6 space-y-3">
          <h2 className="text-sm font-bold text-ivory-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-clay" />
            Current MVP Limitations
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MessageSquare, label: 'LLM Chat', note: 'Not connected — plans are mock-generated' },
              { icon: Shield, label: 'OAuth Login', note: 'GitHub/Google scaffolded, not implemented' },
              { icon: Server, label: 'MCP Gateway', note: 'Registry built, real tool execution TBD' },
              { icon: Award, label: 'External Skills', note: '8 inactive candidates from repo research' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-3 bg-ivory-50 rounded-xl p-3 border border-ivory-100">
                <div className="p-1.5 rounded-lg bg-ivory-100 text-ivory-500 shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-ivory-700">{item.label}</span>
                  <p className="text-[10px] text-ivory-400 mt-0.5 leading-relaxed">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================================================================
            SUGGESTED PROMPTS
            ================================================================ */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-ivory-500 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Try a prompt to get started
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {suggestedPrompts.map((item) => (
              <button
                key={item.prompt}
                onClick={() => onTryPrompt(item.prompt)}
                disabled={!runtimeConnected}
                className="bg-white border border-ivory-200 hover:border-clay/30 hover:shadow-md rounded-xl p-4 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-clay/10 text-clay group-hover:bg-clay/20 transition-colors">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-ivory-300 group-hover:text-clay transition-colors group-hover:translate-x-0.5" />
                </div>
                <p className="text-xs font-semibold text-ivory-700 group-hover:text-clay transition-colors">
                  {item.label}
                </p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-ivory-400 text-center">
            The agent will plan before acting — approve or reject each plan.
          </p>
        </div>

        {/* ================================================================
            DISMISS BUTTON
            ================================================================ */}
        <div className="text-center pt-2">
          <button
            onClick={handleDismiss}
            className="text-xs text-ivory-400 hover:text-ivory-600 underline underline-offset-2 transition-colors"
          >
            Dismiss welcome screen — go to chat
          </button>
        </div>
      </div>
    </div>
  );
}
