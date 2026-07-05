import { AgentPlan, AgentTaskType } from '@aster-code/shared';
import {
  CheckCircle, ChevronDown, ChevronUp, FileText, Shield,
  ThumbsUp, ThumbsDown, Lock
} from 'lucide-react';
import { useState } from 'react';

interface AgentPlanPanelProps {
  plan: AgentPlan;
  taskType: AgentTaskType;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}

export default function AgentPlanPanel({ plan, taskType, onApprove, onReject, isProcessing }: AgentPlanPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getPermissionBadge = (level: string) => {
    switch (level) {
      case 'read-only':
        return { color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Read Only' };
      case 'suggest-edits':
        return { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Suggest Edits' };
      case 'apply-edits-after-approval':
        return { color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Needs Approval' };
      case 'run-safe-commands-after-approval':
        return { color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'Cmd + Approval' };
      case 'dangerous-disabled':
        return { color: 'bg-rose-50 text-rose-600 border-rose-200', label: 'Blocked' };
      default:
        return { color: 'bg-ivory-100 text-ivory-500 border-ivory-200', label: level };
    }
  };

  const getTaskTypeLabel = (type: AgentTaskType) => {
    switch (type) {
      case 'explain': return { label: 'Explanation', color: 'bg-purple-50 text-purple-600 border-purple-200' };
      case 'plan': return { label: 'Planning', color: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'edit-code': return { label: 'Code Edit', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'debug-build': return { label: 'Debug', color: 'bg-orange-50 text-orange-600 border-orange-200' };
      case 'ui-fix': return { label: 'UI Fix', color: 'bg-pink-50 text-pink-600 border-pink-200' };
      case 'dependency-fix': return { label: 'Dependency', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' };
      case 'docs': return { label: 'Documentation', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' };
    }
  };

  const taskInfo = getTaskTypeLabel(taskType);

  const canApprove = plan.status === 'pending-approval' && !isProcessing;

  return (
    <div className="bg-white border border-ivory-200 rounded-xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-ivory-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-ivory-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#866854]" />
              Agent Execution Plan
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${taskInfo.color}`}>
                {taskInfo.label}
              </span>
              <span className="text-[10px] text-ivory-400 font-mono">{plan.steps.length} steps</span>
              {plan.selectedSkillIds.length > 0 && (
                <span className="text-[10px] text-ivory-400">
                  • {plan.selectedSkillIds.length} skills
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
              plan.status === 'pending-approval' ? 'bg-amber-50 text-amber-600 border-amber-200' :
              plan.status === 'approved' || plan.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
              plan.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
              plan.status === 'executing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
              'bg-ivory-100 text-ivory-500 border-ivory-200'
            }`}>
              {plan.status.replace(/-/g, ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Selected skills pills */}
        {plan.selectedSkillIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plan.selectedSkillIds.map(skillId => (
              <span
                key={skillId}
                className="text-[9px] px-1.5 py-0.5 rounded border border-[#866854]/20 bg-clay/5 text-clay font-mono font-medium"
              >
                {skillId}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Steps list */}
      <div className="divide-y divide-ivory-100">
        {plan.steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id);
          const permBadge = getPermissionBadge(step.permissionLevel);

          return (
            <div key={step.id} className="hover:bg-ivory-50/50 transition-colors">
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full text-left p-4 flex items-start gap-3"
              >
                {/* Step number */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  step.status === 'done'
                    ? 'bg-emerald-100 text-emerald-600'
                    : step.status === 'running'
                    ? 'bg-blue-100 text-blue-600'
                    : step.status === 'blocked'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-ivory-100 text-ivory-500'
                }`}>
                  {step.status === 'done' ? <CheckCircle className="w-3.5 h-3.5" /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ivory-800">{step.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${permBadge.color}`}>
                      {permBadge.label}
                    </span>
                    {step.toolName && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-ivory-200 bg-ivory-50 text-ivory-500 font-mono">
                        {step.toolName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ivory-500 mt-0.5 line-clamp-2">{step.reason}</p>
                </div>

                <div className="shrink-0 text-ivory-400 mt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pl-[52px] space-y-2">
                  <p className="text-xs text-ivory-600 leading-relaxed">{step.description}</p>
                  {step.affectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <FileText className="w-3 h-3 text-ivory-400" />
                      {step.affectedFiles.map((file, i) => (
                        <span key={i} className="text-[10px] bg-ivory-100 text-ivory-600 border border-ivory-200 rounded px-1.5 py-0.5 font-mono">
                          {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Approval buttons */}
      {canApprove && (
        <div className="p-4 border-t border-ivory-100 bg-amber-50/50">
          <div className="flex gap-3">
            <button
              onClick={onReject}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-rose-200 bg-white text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsDown className="w-4 h-4" />
              Reject Plan
            </button>
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#866854] text-white text-sm font-semibold hover:bg-[#725441] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
            >
              <ThumbsUp className="w-4 h-4" />
              Approve & Execute
            </button>
          </div>
          <p className="text-[10px] text-ivory-400 text-center mt-2">
            Approving will run all steps sequentially. File writes and commands are simulated in MVP.
          </p>
        </div>
      )}

      {/* Post-approval info */}
      {plan.status === 'executing' && (
        <div className="p-4 border-t border-ivory-100 bg-blue-50/50 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-700 font-medium">Executing plan...</span>
          </div>
          <p className="text-[10px] text-ivory-500">Steps are running sequentially. Check the activity feed for progress.</p>
        </div>
      )}

      {plan.status === 'completed' && (
        <div className="p-4 border-t border-ivory-100 bg-emerald-50/50 text-center">
          <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <span className="text-xs text-emerald-700 font-medium">All steps completed</span>
        </div>
      )}

      {plan.status === 'rejected' && (
        <div className="p-4 border-t border-ivory-100 bg-rose-50/50 text-center">
          <Lock className="w-4 h-4 text-rose-500 mx-auto mb-1" />
          <span className="text-xs text-rose-700 font-medium">Plan rejected — no actions taken</span>
        </div>
      )}
    </div>
  );
}
