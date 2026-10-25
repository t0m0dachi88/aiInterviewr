import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  KeyRound,
  Building2,
  Users,
  ArrowRight,
  Construction,
} from "lucide-react";

export const DashboardPlaceholderPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Honest Placeholder Header */}
      <div className="rounded-2xl glass-panel p-8 border border-slate-800 space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <Construction className="h-3.5 w-3.5" />
          <span>Scheduled for Phase 1: Authentication & Organizations</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Hiring Team & Interviewer Dashboard
        </h1>

        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">
          This dashboard view is currently an architectural placeholder. In
          accordance with production engineering standards, no fake statistics
          or dummy interview cards are displayed before the underlying
          authentication and data access layers are implemented.
        </p>

        <div className="pt-2">
          <Link
            to="/system-status"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
          >
            <span>Check Backend System Status</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Planned Phase 1 Capabilities */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Capabilities Scheduled for Phase 1 Implementation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl glass-card border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Authentication & Token Rotation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Email/password registration, password hashing (Argon2id/bcrypt),
              short-lived JWT access tokens, and rotating refresh-token
              families.
            </p>
          </div>

          <div className="p-5 rounded-xl glass-card border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Multi-Tenant Organizations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organization creation, slug generation, tenant-isolated data
              access controls, and organization settings configuration.
            </p>
          </div>

          <div className="p-5 rounded-xl glass-card border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Membership & Invitations
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Role-based access (owner, admin, interviewer), email invitations
              with expiring tokens, and audit trails for security events.
            </p>
          </div>

          <div className="p-5 rounded-xl glass-card border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Shield className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Tenant Isolation Guards
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforcement that all requests verify organization context
              server-side, preventing any cross-tenant data leakage or privilege
              escalation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
