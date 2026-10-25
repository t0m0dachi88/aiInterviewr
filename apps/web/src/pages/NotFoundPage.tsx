import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          404 - Page Not Found
        </h1>
        <p className="text-slate-400 text-sm max-w-md">
          The requested route does not exist or has moved. Return to the
          platform overview.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Return to Overview</span>
      </Link>
    </div>
  );
};
