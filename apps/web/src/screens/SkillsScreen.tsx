import { useState, useEffect } from 'react';
import { Award, Shield, Lock, RefreshCw, AlertTriangle } from 'lucide-react';
import { SkillDefinition } from '@aster-code/shared';

export default function SkillsScreen() {
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch skills from backend runtime
  const fetchSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/agent/skills');
      if (!res.ok) {
        throw new Error(`Failed to load skills: ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setSkills(data.skills);
      }
    } catch (err: any) {
      console.error('Failed to fetch skills from runtime:', err);
      setError(err.message || 'Could not connect to runtime server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const toggleExecutionMode = async (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;

    const newMode = skill.executionMode === 'auto' ? 'ask' : 'auto';

    // Optimistic update
    setSkills(prev =>
      prev.map(s => (s.id === id ? { ...s, executionMode: newMode } : s))
    );

    // Sync with backend
    try {
      await fetch(`/api/agent/skills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionMode: newMode }),
      });
    } catch (err) {
      console.error(`Failed to update skill ${id}:`, err);
    }
  };

  const toggleStatus = async (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;

    const newStatus = skill.status === 'active' ? 'inactive' as const : 'active' as const;

    // Optimistic update
    setSkills(prev =>
      prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
    );

    // Sync with backend
    try {
      await fetch(`/api/agent/skills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(`Failed to update skill ${id}:`, err);
    }
  };

  return (
    <div className="h-full w-full bg-ivory-50 overflow-y-auto p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-ivory-200 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-ivory-900 leading-tight">Agent Skills</h1>
            <p className="text-sm text-ivory-500 mt-1">
              Review and audit specific tool skills that Aster agents can run. Adjust confirmation flags to restrict background execution.
            </p>
          </div>
          <button
            onClick={fetchSkills}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ivory-200 bg-white text-ivory-600 text-xs font-medium hover:bg-ivory-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && skills.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-clay animate-spin mx-auto mb-3" />
            <p className="text-sm text-ivory-500">Loading skills from runtime server...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Could not load skills from runtime</p>
            <p className="text-xs text-amber-600 mt-0.5">{error}</p>
            <p className="text-xs text-amber-500 mt-1">Using built-in skill definitions as fallback. Start the runtime server for live skill management.</p>
          </div>
        </div>
      )}

      {/* Grid of Skill Cards */}
      <div className="grid grid-cols-2 gap-6">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`bg-white border rounded-xl p-5 shadow-soft transition-all duration-200 flex flex-col justify-between gap-4 ${
              skill.status === 'inactive' ? 'opacity-60 border-ivory-200/50 bg-[#FCFAF7]/50' : 'border-ivory-200'
            }`}
          >
            {/* Header */}
            <div>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-ivory-100/70 border border-ivory-200/60 text-[#866854] shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ivory-800">{skill.name}</h3>
                    <span className="text-[10px] text-ivory-400 font-mono">id: {skill.id}</span>
                  </div>
                </div>

                {/* Active/Inactive Toggle Button */}
                <button
                  onClick={() => toggleStatus(skill.id)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                    skill.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800'
                      : 'bg-ivory-100 text-ivory-500 border-ivory-200 hover:bg-ivory-200'
                  }`}
                >
                  {skill.status === 'active' ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-ivory-500 mt-3.5 leading-relaxed">{skill.description}</p>
            </div>

            {/* Permissions & Mode Setting */}
            <div className="border-t border-ivory-100 pt-3.5 flex flex-col gap-3">
              {/* Permissions list */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <Shield className="w-3.5 h-3.5 text-ivory-400 mr-1 shrink-0" />
                {skill.permissions.map((perm: string) => (
                  <span key={perm} className="text-[9px] bg-ivory-100 text-ivory-600 border border-ivory-200 rounded px-1.5 py-0.5 font-mono">
                    {perm}
                  </span>
                ))}
              </div>

              {/* Action and verification toggles */}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed border-ivory-100">
                <span className="text-ivory-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-ivory-400" /> Confirm execution:
                </span>

                <button
                  onClick={() => skill.status === 'active' && toggleExecutionMode(skill.id)}
                  disabled={skill.status === 'inactive'}
                  className={`text-[10px] font-semibold px-2 py-1 rounded transition-all ${
                    skill.executionMode === 'ask'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : 'bg-ivory-100 text-ivory-600 border border-ivory-200 hover:bg-ivory-200/80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {skill.executionMode === 'ask' ? 'Requires Approval' : 'Auto-Approve'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
