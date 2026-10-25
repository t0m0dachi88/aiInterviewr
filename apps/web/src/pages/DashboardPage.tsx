import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  OrganizationMember,
  OrganizationInvitationItem,
  listMembersApi,
  updateMemberRoleApi,
  removeMemberApi,
  transferOwnershipApi,
  listInvitationsApi,
  createInvitationApi,
  revokeInvitationApi,
  updateOrganizationApi,
} from "../lib/api-client";
import {
  Building2,
  Users,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  Settings,
  UserPlus,
  AlertCircle,
  Loader2,
  Crown,
} from "lucide-react";

export const DashboardPage: React.FC = () => {
  const {
    user,
    activeOrg,
    organizations,
    setActiveOrg,
    createOrganization,
    refreshOrganizations,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"members" | "settings">("members");

  // Create Org modal state
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [createOrgError, setCreateOrgError] = useState<string | null>(null);

  // Members state
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitationItem[]>(
    [],
  );
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "interviewer">(
    "interviewer",
  );
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  // Org settings form state
  const [settingsName, setSettingsName] = useState("");
  const [settingsDuration, setSettingsDuration] = useState(60);
  const [settingsRecording, setSettingsRecording] = useState(false);
  const [settingsLanguages, setSettingsLanguages] = useState<string[]>([
    "javascript",
    "python",
    "cpp",
  ]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isOwner = activeOrg?.role === "owner";
  const isAdmin = activeOrg?.role === "admin";
  const canManage = isOwner || isAdmin;

  const loadTeamData = useCallback(async () => {
    if (!activeOrg) return;
    setIsLoadingTeam(true);
    setTeamError(null);
    try {
      const [membersList, invitesList] = await Promise.all([
        listMembersApi(activeOrg.id),
        canManage ? listInvitationsApi(activeOrg.id) : Promise.resolve([]),
      ]);
      setMembers(membersList);
      setInvitations(invitesList);
    } catch (err: any) {
      setTeamError(err?.message || "Failed to load team data");
    } finally {
      setIsLoadingTeam(false);
    }
  }, [activeOrg, canManage]);

  useEffect(() => {
    if (activeOrg) {
      loadTeamData();
      setSettingsName(activeOrg.name);
      setSettingsDuration(
        activeOrg.settings?.defaultInterviewDurationMinutes || 60,
      );
      setSettingsRecording(Boolean(activeOrg.settings?.recordingEnabled));
      setSettingsLanguages(
        activeOrg.settings?.allowedLanguages || ["javascript", "python", "cpp"],
      );
    }
  }, [activeOrg, loadTeamData]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreatingOrg(true);
    setCreateOrgError(null);
    try {
      await createOrganization({
        name: newOrgName.trim(),
        slug: newOrgSlug.trim() || undefined,
      });
      setShowCreateOrgModal(false);
      setNewOrgName("");
      setNewOrgSlug("");
    } catch (err: any) {
      setCreateOrgError(err?.message || "Failed to create organization");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    setDebugToken(null);

    try {
      const res = await createInvitationApi(activeOrg.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteSuccess(`Invitation issued to ${inviteEmail}!`);
      if (res.debugToken) {
        setDebugToken(res.debugToken);
      }
      setInviteEmail("");
      loadTeamData();
    } catch (err: any) {
      setInviteError(err?.message || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!activeOrg) return;
    try {
      await revokeInvitationApi(activeOrg.id, invitationId);
      loadTeamData();
    } catch (err: any) {
      alert(err?.message || "Failed to revoke invitation");
    }
  };

  const handleChangeRole = async (
    membershipId: string,
    role: "admin" | "interviewer",
  ) => {
    if (!activeOrg) return;
    try {
      await updateMemberRoleApi(activeOrg.id, membershipId, role);
      loadTeamData();
    } catch (err: any) {
      alert(err?.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (
    membershipId: string,
    memberName: string,
  ) => {
    if (!activeOrg) return;
    if (
      !confirm(
        `Are you sure you want to remove ${memberName} from this organization?`,
      )
    ) {
      return;
    }
    try {
      await removeMemberApi(activeOrg.id, membershipId);
      loadTeamData();
    } catch (err: any) {
      alert(err?.message || "Failed to remove member");
    }
  };

  const handleTransferOwnership = async (membershipId: string) => {
    if (!activeOrg) return;
    if (
      !confirm(
        "Are you sure you want to transfer ownership? You will be demoted to Admin.",
      )
    ) {
      return;
    }
    try {
      await transferOwnershipApi(activeOrg.id, membershipId);
      await refreshOrganizations();
      loadTeamData();
    } catch (err: any) {
      alert(err?.message || "Failed to transfer ownership");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      await updateOrganizationApi(activeOrg.id, {
        name: settingsName.trim(),
        settings: {
          defaultInterviewDurationMinutes: settingsDuration,
          recordingEnabled: settingsRecording,
          allowedLanguages: settingsLanguages,
        },
      });
      await refreshOrganizations();
      setSettingsSuccess("Organization settings updated successfully!");
    } catch (err: any) {
      setSettingsError(err?.message || "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // If user has no organizations
  if (organizations.length === 0) {
    return (
      <div className="py-12 max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Create your first Organization
          </h1>
          <p className="text-sm text-slate-400">
            Welcome, {user?.displayName}! An organization groups your
            interviews, hiring teammates, and candidates.
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-8 border border-slate-800 shadow-xl">
          {createOrgError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{createOrgError}</span>
            </div>
          )}

          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="e.g. Acme Tech"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                URL Slug (Optional)
              </label>
              <input
                type="text"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                placeholder="e.g. acme-tech"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500">
                Leave blank to automatically derive from organization name.
              </p>
            </div>

            <button
              type="submit"
              disabled={isCreatingOrg || !newOrgName.trim()}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
            >
              {isCreatingOrg ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating organization...</span>
                </>
              ) : (
                <span>Create Organization</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Organization Header & Switcher Banner */}
      <div className="rounded-2xl glass-panel p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-extrabold text-white">
                {activeOrg?.name}
              </h1>
              {activeOrg?.role && (
                <span
                  className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    activeOrg.role === "owner"
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      : activeOrg.role === "admin"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {activeOrg.role}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              slug: {activeOrg?.slug}
            </p>
          </div>
        </div>

        {/* Org Actions: Switcher & New Org */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {organizations.length > 1 && (
            <div className="relative flex-1 sm:flex-none">
              <select
                value={activeOrg?.id}
                onChange={(e) => {
                  const selected = organizations.find(
                    (o) => o.id === e.target.value,
                  );
                  if (selected) setActiveOrg(selected);
                }}
                className="w-full sm:w-auto appearance-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.role})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          )}

          <button
            onClick={() => setShowCreateOrgModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Org</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-8">
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-4 px-1 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "members"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members & Access</span>
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-300">
            {members.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-4 px-1 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === "settings"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Organization Settings</span>
        </button>
      </div>

      {/* TAB CONTENT: MEMBERS */}
      {activeTab === "members" && (
        <div className="space-y-8">
          {/* Header & Invite CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Active Members</h2>
              <p className="text-sm text-slate-400">
                Teammates who can create, conduct, or manage interviews.
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Teammate</span>
              </button>
            )}
          </div>

          {teamError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {teamError}
            </div>
          )}

          {/* Members Table */}
          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
            {isLoadingTeam ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span>Loading team members...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Joined</th>
                      {canManage && (
                        <th className="px-6 py-4 text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {members.map((member) => {
                      const isSelf = member.userId === user?.id;
                      const isTargetOwner = member.role === "owner";

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-indigo-400">
                                {member.user?.displayName?.charAt(0) || "U"}
                              </div>
                              <div>
                                <div className="font-semibold text-white flex items-center space-x-1.5">
                                  <span>
                                    {member.user?.displayName || "Unknown User"}
                                  </span>
                                  {isSelf && (
                                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                      you
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 font-mono">
                                  {member.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                member.role === "owner"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                  : member.role === "admin"
                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              }`}
                            >
                              {member.role === "owner" && (
                                <Crown className="w-3 h-3 mr-1" />
                              )}
                              <span>{member.role}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </td>
                          {canManage && (
                            <td className="px-6 py-4 text-right">
                              {!isTargetOwner && (
                                <div className="flex items-center justify-end space-x-2">
                                  <select
                                    value={member.role}
                                    onChange={(e) =>
                                      handleChangeRole(
                                        member.id,
                                        e.target.value as
                                          "admin" | "interviewer",
                                      )
                                    }
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                                  >
                                    <option value="interviewer">
                                      Interviewer
                                    </option>
                                    <option value="admin">Admin</option>
                                  </select>

                                  {isOwner && (
                                    <button
                                      title="Transfer Ownership"
                                      onClick={() =>
                                        handleTransferOwnership(member.id)
                                      }
                                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                                    >
                                      <Crown className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    title="Remove Member"
                                    onClick={() =>
                                      handleRemoveMember(
                                        member.id,
                                        member.user?.displayName ||
                                          "this member",
                                      )
                                    }
                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Invitations Section */}
          {canManage && (
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Pending Invitations</span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {invitations.length}
                </span>
              </h3>

              {invitations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  No pending invitations. Click "Invite Teammate" to invite
                  interviewers or admins.
                </div>
              ) : (
                <div className="rounded-xl glass-panel border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Invited Email</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Expires</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {invitations.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/30">
                          <td className="px-6 py-3 font-mono text-xs text-white">
                            {inv.email}
                          </td>
                          <td className="px-6 py-3 text-xs capitalize text-slate-300">
                            {inv.invitedRole}
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-400">
                            {new Date(inv.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SETTINGS */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-2xl glass-panel p-8 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2">
              Workspace Settings
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Configure default parameters for interviews conducted by{" "}
              {activeOrg?.name}.
            </p>

            {settingsSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            {settingsError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {settingsError}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Organization Name
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  required
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Default Interview Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="180"
                  disabled={!canManage}
                  value={settingsDuration}
                  onChange={(e) => setSettingsDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Recording Policy Default
                </label>
                <div className="flex items-center space-x-3 pt-1">
                  <input
                    type="checkbox"
                    id="recordingToggle"
                    disabled={!canManage}
                    checked={settingsRecording}
                    onChange={(e) => setSettingsRecording(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <label
                    htmlFor="recordingToggle"
                    className="text-sm text-slate-300"
                  >
                    Enable session recording policy by default (candidate
                    consent still required)
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Allowed Coding Languages
                </label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {["javascript", "python", "cpp"].map((lang) => {
                    const checked = settingsLanguages.includes(lang);
                    return (
                      <label
                        key={lang}
                        className="inline-flex items-center space-x-2 text-sm text-slate-300 capitalize cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={!canManage}
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettingsLanguages([
                                ...settingsLanguages,
                                lang,
                              ]);
                            } else {
                              setSettingsLanguages(
                                settingsLanguages.filter((l) => l !== lang),
                              );
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                        />
                        <span>{lang === "cpp" ? "C++" : lang}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {canManage && (
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="mt-6 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center space-x-2"
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* CREATE ORG MODAL */}
      {showCreateOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Create Organization
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new hiring workspace. You will be assigned as its Owner.
            </p>

            {createOrgError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {createOrgError}
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Stripe Inc"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  placeholder="e.g. stripe-inc"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateOrgModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingOrg || !newOrgName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/25"
                >
                  {isCreatingOrg ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl glass-panel p-6 border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              Invite Teammate
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Invite a colleague to collaborate on interviews in{" "}
              {activeOrg?.name}.
            </p>

            {inviteSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-2">
                <div>{inviteSuccess}</div>
                {debugToken && (
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-indigo-300 font-mono break-all">
                    Invitation Link:{" "}
                    <a
                      href={`/invitations/accept?token=${encodeURIComponent(debugToken)}`}
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      /invitations/accept?token={debugToken}
                    </a>
                  </div>
                )}
              </div>
            )}

            {inviteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {inviteError}
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Colleague's Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="interviewer@company.com"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "admin" | "interviewer")
                  }
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="interviewer">
                    Interviewer (conduct interviews)
                  </option>
                  <option value="admin">
                    Admin (manage members & settings)
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteSuccess(null);
                    setInviteError(null);
                    setDebugToken(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-sm font-medium"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-md shadow-indigo-600/25"
                >
                  {isInviting ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
