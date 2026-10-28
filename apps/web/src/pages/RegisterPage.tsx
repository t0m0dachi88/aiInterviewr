import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please ensure your password satisfies all security criteria.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-slate-400">
            Get started with AI-driven technical interviewing in seconds
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-8 border border-slate-800 shadow-xl shadow-black/40">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div
                  className={`flex items-center space-x-1.5 ${hasLength ? "text-emerald-400" : "text-slate-500"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>8+ characters</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${hasUpper ? "text-emerald-400" : "text-slate-500"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Uppercase letter</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${hasLower ? "text-emerald-400" : "text-slate-500"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lowercase letter</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least 1 number</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
