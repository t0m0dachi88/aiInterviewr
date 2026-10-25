import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Radio,
  Clock,
  Shield,
} from "lucide-react";
import {
  getHealth,
  getReadiness,
  type HealthLivenessData,
  type HealthReadinessData,
} from "../lib/api-client";

export const SystemStatusPage: React.FC = () => {
  const [liveness, setLiveness] = useState<HealthLivenessData | null>(null);
  const [readiness, setReadiness] = useState<HealthReadinessData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [liveRes, readyRes] = await Promise.all([
        getHealth(),
        getReadiness(),
      ]);
      setLiveness(liveRes);
      setReadiness(readyRes);
      setLastChecked(new Date());
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to reach backend API. Ensure the backend server is running on http://localhost:5000",
      );
      setLiveness(null);
      setReadiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const isDbHealthy = readiness?.dependencies?.database?.connected ?? false;
  const isRedisHealthy = readiness?.dependencies?.redis?.connected ?? false;
  const isAllReady = readiness?.isReady ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Activity className="h-7 w-7 text-indigo-400" />
            <span>Live System Diagnostics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time health probes verifying API, MongoDB Atlas, and Redis
            connectivity.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isLoading}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>{isLoading ? "Checking..." : "Refresh Status"}</span>
        </button>
      </div>

      {/* Global Status Banner */}
      {error ? (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-5 flex items-start space-x-3 text-rose-300">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-sm">Backend API Unreachable</div>
            <p className="text-xs text-rose-400 leading-relaxed">{error}</p>
            <div className="text-xs text-rose-300/80 mt-2 font-mono bg-rose-950/40 p-2 rounded border border-rose-500/10">
              Run: <span className="text-rose-200">npm run dev:api</span> to
              start the Express service.
            </div>
          </div>
        </div>
      ) : isAllReady ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex items-center space-x-3 text-emerald-300">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">
              All Services Ready & Connected
            </div>
            <div className="text-xs text-emerald-400/80">
              Express API control plane, MongoDB Atlas, and Redis are fully
              operational.
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-5 flex items-start space-x-3 text-amber-300">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">
              Service Dependencies Degraded
            </div>
            <div className="text-xs text-amber-400/80">
              The API process is active, but one or more required dependencies
              (MongoDB Atlas or Redis) are not currently reachable.
            </div>
          </div>
        </div>
      )}

      {/* Component Probes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Probe 1: Express API */}
        <div className="rounded-xl glass-card p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Express API
                </h3>
                <span className="text-xs text-slate-400">Control Plane</span>
              </div>
            </div>
            {liveness?.status === "ok" ? (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Offline
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Service:</span>
              <span className="font-mono text-slate-200">
                {liveness?.service || "@platform/api"}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Version:</span>
              <span className="font-mono text-slate-200">
                {liveness?.version || "0.1.0"}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Uptime:</span>
              <span className="font-mono text-slate-200">
                {liveness ? `${liveness.uptimeSeconds}s` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Probe 2: MongoDB Atlas */}
        <div className="rounded-xl glass-card p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  MongoDB Atlas
                </h3>
                <span className="text-xs text-slate-400">
                  Cloud Mongoose ODM
                </span>
              </div>
            </div>
            {isDbHealthy ? (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Disconnected
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Driver Status:</span>
              <span className="font-mono text-slate-200">
                {readiness?.dependencies?.database?.status || "unconnected"}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Connection URI:</span>
              <span className="font-mono text-slate-400 text-[11px] truncate max-w-[140px]">
                Configured via .env
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Security:</span>
              <span className="text-emerald-400 flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Atlas TLS</span>
              </span>
            </div>
          </div>
        </div>

        {/* Probe 3: Upstash Redis */}
        <div className="rounded-xl glass-card p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Upstash Redis
                </h3>
                <span className="text-xs text-slate-400">
                  Managed Cloud (TLS)
                </span>
              </div>
            </div>
            {isRedisHealthy ? (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Disconnected
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="font-mono text-slate-200">
                {readiness?.dependencies?.redis?.status || "uninitialized"}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Ping Latency:</span>
              <span className="font-mono text-slate-200">
                {readiness?.dependencies?.redis?.latencyMs !== undefined
                  ? `${readiness.dependencies.redis.latencyMs}ms`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>BullMQ Queue:</span>
              <span className="text-indigo-400">Upstash TLS Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp footer */}
      {lastChecked && (
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Last health probe verified at: {lastChecked.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
