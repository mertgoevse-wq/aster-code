import { useState } from 'react';
import { Award, Shield, Lock } from 'lucide-react';
import { SkillDefinition } from '@aster-code/shared';

export default function SkillsScreen() {
  const [skills, setSkills] = useState<SkillDefinition[]>([
    {
      id: 'project-planner',
      name: 'Project Planner',
      description: 'Generates structural design plans, checklists, and dependency graphs before writing code.',
      permissions: ['read_workspace', 'write_workspace'],
      executionMode: 'auto',
      status: 'active',
    },
    {
      id: 'codebase-auditor',
      name: 'Codebase Auditor',
      description: 'Reviews file structure, scans for logical bugs, and searches for dead imports.',
      permissions: ['read_workspace'],
      executionMode: 'auto',
      status: 'active',
    },
    {
      id: 'ui-debugger',
      name: 'UI Debugger',
      description: 'Analyzes visual layouts, detects alignment bugs, and suggests styling adjustments.',
      permissions: ['read_workspace', 'write_workspace'],
      executionMode: 'ask',
      status: 'active',
    },
    {
      id: 'dependency-checker',
      name: 'Dependency Checker',
      description: 'Reviews package registry mappings, runs security vulnerability audits, and flags deprecated libs.',
      permissions: ['read_workspace', 'execute_commands'],
      executionMode: 'ask',
      status: 'active',
    },
    {
      id: 'build-fixer',
      name: 'Build Fixer',
      description: 'Reads TypeScript compiler compiler errors and repairs modules automatically.',
      permissions: ['read_workspace', 'write_workspace', 'execute_commands'],
      executionMode: 'ask',
      status: 'active',
    },
    {
      id: 'test-writer',
      name: 'Test Writer',
      description: 'Scans files to output unit and integration test coverage files in test folders.',
      permissions: ['read_workspace', 'write_workspace'],
      executionMode: 'auto',
      status: 'active',
    },
    {
      id: 'readme-writer',
      name: 'README Writer',
      description: 'Synthesizes code files to write comprehensive documentation and setup guidelines.',
      permissions: ['read_workspace', 'write_workspace'],
      executionMode: 'auto',
      status: 'active',
    },
    {
      id: 'android-apk-helper',
      name: 'Android APK Helper',
      description: 'Diagnoses SDK environment variables and triggers Gradle build tasks securely.',
      permissions: ['read_workspace', 'execute_commands'],
      executionMode: 'ask',
      status: 'active',
    }
  ]);

  const toggleExecutionMode = (id: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === id ? { ...s, executionMode: s.executionMode === 'auto' ? 'ask' : 'auto' } : s))
    );
  };

  const toggleStatus = (id: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s))
    );
  };

  return (
    <div className="h-full w-full bg-ivory-50 overflow-y-auto p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-ivory-200 pb-6">
        <h1 className="font-serif text-3xl font-bold text-ivory-900 leading-tight">Agent Skills</h1>
        <p className="text-sm text-ivory-500 mt-1">
          Review and audit specific tool skills that Aster agents can run. Adjust confirmation flags to restrict background execution.
        </p>
      </div>

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
