import { AgentEvent, AgentStepStatus } from '@aster-code/shared';
import { CheckCircle, Play, XCircle, Lock, FileText, Terminal, Clock } from 'lucide-react';

interface AgentActivityFeedProps {
  events: AgentEvent[];
  isExecuting: boolean;
}

export default function AgentActivityFeed({ events, isExecuting }: AgentActivityFeedProps) {
  const getStatusIcon = (status: AgentStepStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'running':
        return <Play className="w-3.5 h-3.5 text-blue-500 animate-pulse" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
      case 'blocked':
        return <Lock className="w-3.5 h-3.5 text-amber-500" />;
      case 'pending':
      default:
        return <Clock className="w-3.5 h-3.5 text-ivory-400" />;
    }
  };

  const getStatusColor = (status: AgentStepStatus) => {
    switch (status) {
      case 'done': return 'border-l-emerald-400 bg-emerald-50/30';
      case 'running': return 'border-l-blue-400 bg-blue-50/30';
      case 'error': return 'border-l-rose-400 bg-rose-50/30';
      case 'blocked': return 'border-l-amber-400 bg-amber-50/30';
      case 'pending': return 'border-l-ivory-300';
      default: return 'border-l-ivory-300';
    }
  };

  const getStatusBadge = (status: AgentStepStatus) => {
    switch (status) {
      case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'running': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'error': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'blocked': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'pending': return 'bg-ivory-100 text-ivory-500 border-ivory-200';
      default: return 'bg-ivory-100 text-ivory-500 border-ivory-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-ivory-200 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-ivory-500 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          Agent Activity
        </h3>
        {isExecuting && (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-clay animate-ping" />
            <span className="text-[10px] text-ivory-500">Running</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ivory-400">
            <Terminal className="w-8 h-8 mb-2 opacity-30 text-[#866854]" />
            <p className="text-xs">No agent activity yet. Start a task to see the execution timeline.</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`p-3 bg-white rounded-lg border border-ivory-200/80 border-l-2 shadow-soft-sm flex gap-3 text-xs leading-relaxed ${getStatusColor(event.status)}`}
            >
              <div className="mt-0.5 shrink-0">{getStatusIcon(event.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="font-semibold text-ivory-800 truncate">{event.title}</span>
                  <span className="text-[9px] text-ivory-400 font-mono shrink-0 ml-2">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-ivory-500 leading-relaxed break-all">
                  {event.message}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${getStatusBadge(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                  {event.toolName && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-ivory-200 bg-ivory-50 text-ivory-500 font-mono">
                      {event.toolName}
                    </span>
                  )}
                  {event.affectedFile && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-ivory-200 bg-ivory-50 text-ivory-500 flex items-center gap-1 font-mono">
                      <FileText className="w-2.5 h-2.5" />
                      {event.affectedFile}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
