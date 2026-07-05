import { RoutingResult, RiskLevel } from '@aster-code/shared';
import {
  BrainCircuit, Wrench, Shield, AlertTriangle, CheckCircle,
  Lock, Eye, Play, FileText, Globe
} from 'lucide-react';

interface AgentRoutingPreviewProps {
  routing: RoutingResult;
}

export default function AgentRoutingPreview({ routing }: AgentRoutingPreviewProps) {
  const riskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const riskEmoji = (level: RiskLevel) => {
    switch (level) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
    }
  };

  const permIcon = (perm: string) => {
    if (perm.includes('read')) return <Eye className="w-2.5 h-2.5" />;
    if (perm.includes('write')) return <FileText className="w-2.5 h-2.5" />;
    if (perm.includes('command') || perm.includes('execute')) return <Play className="w-2.5 h-2.5" />;
    return <Lock className="w-2.5 h-2.5" />;
  };

  const languageLabel = (lang?: string) => {
    switch (lang) {
      case 'de': return { flag: '🇩🇪', label: 'German' };
      case 'en': return { flag: '🇬🇧', label: 'English' };
      case 'mixed': return { flag: '🌐', label: 'Mixed DE+EN' };
      default: return null;
    }
  };

  const lang = languageLabel(routing.detectedLanguage);

  return (
    <div className="bg-white border border-ivory-200 rounded-xl shadow-soft overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-ivory-100 bg-ivory-50/50">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold text-ivory-800 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#866854]" />
              Agent Routing
            </h3>
            <p className="text-[10px] text-ivory-500 mt-0.5">
              Automatic intent detection and skill selection based on your prompt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lang && (
              <span className="text-[9px] bg-ivory-100 text-ivory-600 border border-ivory-200 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                {lang.flag} {lang.label}
              </span>
            )}
            {routing.requiresApproval && (
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Requires Approval
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Intents detected */}
      <div className="p-4 space-y-3">
        <h4 className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider flex items-center gap-1.5">
          <BrainCircuit className="w-3 h-3" />
          Detected Intents ({routing.intents.length})
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {routing.intents.map((intent, i) => (
            <span
              key={i}
              className={`text-[9px] px-2 py-1 rounded-full border font-medium ${
                intent.candidates.length > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-ivory-100 text-ivory-400 border-ivory-200'
              }`}
              title={`${intent.reason} (${Math.round(intent.confidence * 100)}% confidence)`}
            >
              {intent.intent.replace(/-/g, ' ')}
              <span className="ml-1 opacity-60">{Math.round(intent.confidence * 100)}%</span>
            </span>
          ))}
        </div>
        {/* Intent reasons summary */}
        <div className="space-y-1">
          {routing.intents.filter(i => i.candidates.length > 0).map((intent, i) => (
            <p key={i} className="text-[10px] text-ivory-500 leading-relaxed">
              <span className="font-semibold text-ivory-600">{intent.intent.replace(/-/g, ' ')}:</span>{' '}
              {intent.reason}
            </p>
          ))}
        </div>
      </div>

      {/* Selected Skills */}
      <div className="px-4 pb-4 space-y-3">
        <h4 className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider flex items-center gap-1.5">
          <Wrench className="w-3 h-3" />
          Selected Skills ({routing.selectedSkills.length})
        </h4>

        {routing.selectedSkills.length === 0 ? (
          <div className="text-[10px] text-ivory-400 italic p-3 bg-ivory-50 rounded-lg border border-ivory-200">
            No matching skills found. Try rephrasing your request with more specific keywords.
          </div>
        ) : (
          <div className="space-y-2">
            {routing.selectedSkills.map((skill) => (
              <div
                key={skill.skillId}
                className="p-3 bg-ivory-50 rounded-lg border border-ivory-200/80 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  <CheckCircle className={`w-3.5 h-3.5 ${skill.riskLevel === 'low' ? 'text-emerald-500' : skill.riskLevel === 'medium' ? 'text-amber-500' : 'text-rose-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-ivory-800">{skill.skillName}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold ${riskBadge(skill.riskLevel)}`}>
                      {riskEmoji(skill.riskLevel)} {skill.riskLevel.toUpperCase()}
                    </span>
                    <span className="text-[8px] text-ivory-400 font-mono">
                      {Math.round(skill.confidence * 100)}% match
                    </span>
                  </div>
                  <p className="text-[10px] text-ivory-600 mt-0.5 leading-relaxed">{skill.reason}</p>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {skill.requiredPermissions.map(perm => (
                      <span key={perm} className="text-[8px] px-1.5 py-0.5 rounded border border-ivory-200 bg-white text-ivory-500 font-mono flex items-center gap-1">
                        {permIcon(perm)}
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval Gating Summary */}
      <div className="px-4 pb-3">
        <h4 className="text-[10px] font-semibold text-ivory-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <Shield className="w-3 h-3" />
          Approval Gating
        </h4>
        <div className={`p-3 rounded-lg border text-[10px] leading-relaxed ${
          routing.requiresApproval
            ? 'bg-amber-50/50 border-amber-200 text-amber-800'
            : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
        }`}>
          {routing.requiresApproval ? (
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                This plan requires your approval before execution
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>File edits require per-step approval — you review every change</li>
                <li>Commands require per-step approval — nothing runs without your consent</li>
                <li>You can reject the entire plan or individual steps</li>
                <li>The agent never modifies files or runs commands autonomously</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Safe to execute — read-only or advisory only
              </p>
              <p className="text-emerald-700">
                No file modifications or commands are planned. The agent will only read and analyze.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary footer */}
      <div className="px-4 pb-4">
        <div className="text-[10px] text-ivory-500 bg-ivory-50/50 p-3 rounded-lg border border-ivory-200 leading-relaxed flex items-start gap-2">
          <Shield className="w-3 h-3 text-[#866854] mt-0.5 shrink-0" />
          <span>{routing.summary}</span>
        </div>
      </div>
    </div>
  );
}
