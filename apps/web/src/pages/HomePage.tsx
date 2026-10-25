import React from "react";
import { Link } from "react-router-dom";
import {
  Server,
  Layers,
  Database,
  Cpu,
  ArrowRight,
  Activity,
  CheckCircle2,
  Lock,
} from "lucide-react";

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-8 sm:p-12 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>Phase 0: Repository & Engineering Foundation Completed</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            AI-Powered Technical <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
              Hiring Infrastructure
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            A production-minded platform for conducting collaborative live
            technical interviews, executing candidate code in isolated
            disposable environments, and building structured, human-centered
            evaluation records.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/system-status"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40"
            >
              <Activity className="h-4 w-4" />
              <span>Verify System Status</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all duration-200 border border-slate-700"
            >
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Engineering Pillars Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Core Architecture Pillars
            </h2>
            <p className="text-sm text-slate-400">
              Production standards implemented in Phase 0
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            Phase 0 / 7
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Backend */}
          <div className="rounded-xl glass-card p-6 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-400">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Modular Monolith Backend
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Express.js with strict MVC boundaries per module, request ID
              propagation, centralized error handling, and separate
              initialization and server lifecycle.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Health & Readiness Probes Active</span>
            </div>
          </div>

          {/* Pillar 2: Data & Caching */}
          <div className="rounded-xl glass-card p-6 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              MongoDB Atlas & Upstash Redis
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Mongoose ODM targeting MongoDB Atlas managed clusters via
              environment variables, paired with Upstash Redis (TLS cloud
              instance) for session presence and BullMQ task queues.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Atlas & Upstash TLS Configured</span>
            </div>
          </div>

          {/* Pillar 3: Execution Worker Scaffold */}
          <div className="rounded-xl glass-card p-6 border border-slate-800/80 hover:border-slate-700 transition-all">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">
              Worker Isolation Scaffold
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Dedicated execution service scaffold. Explicitly isolated from the
              host Docker socket in Phase 0 to guarantee security before Phase 4
              sandboxing.
            </p>
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-medium">
              <Lock className="h-4 w-4" />
              <span>Ready for Phase 4 Sandboxes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Roadmap */}
      <div className="rounded-xl glass-panel p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center space-x-3 mb-6">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Incremental Engineering Roadmap
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <div className="font-semibold text-indigo-400 mb-1">
              Phase 0 (Active)
            </div>
            <div className="text-slate-300 font-medium mb-1">
              Repository Foundation
            </div>
            <div className="text-slate-400">
              Monorepo, API health/ready probes, frontend layout, worker
              scaffold.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-400 mb-1">
              Phase 1 (Next)
            </div>
            <div className="text-slate-300 font-medium mb-1">
              Auth & Organizations
            </div>
            <div className="text-slate-500">
              JWT auth, tenant isolation, role matrix, invitation lifecycle.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-400 mb-1">Phase 2</div>
            <div className="text-slate-300 font-medium mb-1">
              Interview Management
            </div>
            <div className="text-slate-500">
              Scheduling, question banks, immutable version snapshots.
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-semibold text-slate-400 mb-1">
              Phase 3 to 7
            </div>
            <div className="text-slate-300 font-medium mb-1">
              Live Interviews & Media
            </div>
            <div className="text-slate-500">
              Monaco, disposable sandboxes, Yjs collaboration, LiveKit media.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
