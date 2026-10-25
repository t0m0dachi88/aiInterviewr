import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Terminal,
  Activity,
  LayoutDashboard,
  Home,
  Shield,
  ExternalLink,
} from "lucide-react";

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-200">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
                  <span>HirePulse</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Phase 0
                  </span>
                </span>
                <span className="text-xs text-slate-400 font-normal">
                  Technical Hiring Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-indigo-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-indigo-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </NavLink>

            <NavLink
              to="/system-status"
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-indigo-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <Activity className="h-4 w-4" />
              <span>Status</span>
            </NavLink>
          </nav>

          {/* Security / Architecture Tag */}
          <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>MongoDB Atlas &bull; Upstash Redis (TLS)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Platform Core: Online</span>
            <span>&bull;</span>
            <span>Architecture Phase 0: Engineering Foundation</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="hover:text-slate-200 transition-colors">
              Modular Monolith MVC
            </span>
            <span>&bull;</span>
            <span className="hover:text-slate-200 transition-colors">
              Isolated Sandboxing Plan
            </span>
            <span>&bull;</span>
            <span className="flex items-center space-x-1 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer">
              <span>Stage B: Live Interviews</span>
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
