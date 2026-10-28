import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { acceptInvitationApi } from "../lib/api-client";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { user, refreshOrganizations } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token) {
      setError("No invitation token found in the URL.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await acceptInvitationApi(token);
      await refreshOrganizations();
      setSuccess(
        `You have successfully joined ${res.organizationName || "the organization"} as a ${res.membership.role}!`,
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to accept invitation. It may have expired or already been used.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Team Invitation
          </h1>
          <p className="text-sm text-slate-400">
            You've been invited to join a hiring workspace on HirePulse
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-8 border border-slate-800 shadow-xl shadow-black/40">
          {!user ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-300">
                You must be signed in with the invited email address to accept
                this invitation.
              </p>
              <div className="flex flex-col space-y-2.5 pt-2">
                <Link
                  to={`/login?redirect=/invitations/accept?token=${encodeURIComponent(token)}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all text-center"
                >
                  Sign In to Accept
                </Link>
                <Link
                  to="/register"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all text-center border border-slate-700"
                >
                  Create an Account
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Invitation Accepted!
              </h2>
              <p className="text-sm text-slate-300">{success}</p>
              <p className="text-xs text-slate-500">
                Redirecting to your dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="text-slate-200 font-medium">Logged in as:</div>
                <div className="font-mono text-indigo-300">{user.email}</div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-400 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleAccept}
                disabled={isSubmitting || !token}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining team...</span>
                  </>
                ) : (
                  <>
                    <span>Accept Invitation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
