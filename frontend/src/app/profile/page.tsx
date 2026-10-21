"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CircleCheck,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

interface Profile {
  id: string;
  username: string;
  email: string;
  role: string;
  privileges: string[] | Record<string, unknown>;
}

interface ProfileResponse {
  success: boolean;
  message: string;
  data: Profile;
}

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getInitials = (username: string) => {
  const parts = username.trim().split(/[._\s-]+/).filter(Boolean);

  if (parts.length > 1) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  return username.slice(0, 2).toUpperCase() || "U";
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async (quiet = false) => {
    if (quiet) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get<ProfileResponse>("/auth/me");

      if (!response.data.success || !response.data.data) {
        throw new Error("Unable to retrieve your account information.");
      }

      setProfile(response.data.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("We couldn’t load your account information. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const permissionData = profile?.privileges;
  const hasPermissionDetails = Array.isArray(permissionData);
  const privileges = hasPermissionDetails
    ? permissionData.filter(
        (privilege): privilege is string => typeof privilege === "string"
      )
    : [];

  const permissionGroups = useMemo(() => {
    return privileges.reduce<Record<string, string[]>>((groups, privilege) => {
      const [resource, ...actions] = privilege.split(":");
      const groupName = formatLabel(resource || "General access");
      const action = formatLabel(actions.join(":") || "Access");

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(action);

      return groups;
    }, {});
  }, [privileges]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
              <span className="h-1.5 w-1.5  bg-emerald-600" />
              Account
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              My profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review your account details and the access assigned to you.
            </p>
          </div>

          {!loading && !error && profile && (
            <button
              type="button"
              onClick={() => void fetchProfile(true)}
              disabled={refreshing}
              className="inline-flex h-10 w-fit items-center justify-center gap-2  border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          )}
        </header>

        {loading && (
          <div className="space-y-5" aria-label="Loading profile">
            <div className=" border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex animate-pulse items-center gap-4">
                <div className="h-16 w-16  bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-4 w-36  bg-slate-100" />
                  <div className="h-3 w-48  bg-slate-100" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle size={16} className="animate-spin text-emerald-700" />
                Loading your profile…
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="h-64 animate-pulse  border border-slate-200 bg-white" />
              <div className="h-64 animate-pulse  border border-slate-200 bg-white" />
            </div>
          </div>
        )}

        {!loading && error && (
          <section className=" border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center  bg-rose-50 text-rose-600">
                <AlertCircle size={21} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                Profile unavailable
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => void fetchProfile()}
                className="mt-5 inline-flex items-center gap-2  bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </section>
        )}

        {!loading && !error && profile && (
          <>
            <section className=" border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center  bg-emerald-50 text-lg font-semibold tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-100">
                    {getInitials(profile.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Signed-in account</p>
                    <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950">
                      {profile.username}
                    </h2>
                    <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-500">
                      <Mail size={14} className="shrink-0 text-slate-400" />
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <span className="inline-flex items-center gap-1.5  border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <CircleCheck size={15} />
                    Active
                  </span>
                </div>
              </div>
            </section>

            <div className="grid items-start gap-5 lg:grid-cols-2">
              <section className="overflow-hidden  border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <span className="flex h-9 w-9 items-center justify-center  bg-emerald-50 text-emerald-700">
                    <UserRound size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Account details
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Information linked to your account.
                    </p>
                  </div>
                </div>

                <dl className="divide-y divide-slate-100 px-5 sm:px-6">
                  <div className="py-4">
                    <dt className="text-xs font-medium text-slate-500">Username</dt>
                    <dd className="mt-1.5 break-words text-sm font-medium text-slate-900">
                      {profile.username}
                    </dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-xs font-medium text-slate-500">Email address</dt>
                    <dd className="mt-1.5 break-all text-sm font-medium text-slate-900">
                      {profile.email}
                    </dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-xs font-medium text-slate-500">Account ID</dt>
                    <dd className="mt-1.5 break-all font-mono text-xs font-medium text-slate-700">
                      {profile.id}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="overflow-hidden  border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                  <span className="flex h-9 w-9 items-center justify-center  bg-emerald-50 text-emerald-700">
                    <KeyRound size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Role access
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Access is based on your assigned role.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-slate-500">Assigned role</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-semibold tracking-tight text-slate-900">
                      {formatLabel(profile.role)}
                    </p>
                    <span className=" bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {privileges.length} {privileges.length === 1 ? "permission" : "permissions"}
                    </span>
                  </div>
                  <div className="mt-5 flex items-start gap-2.5  bg-slate-50 p-3.5 text-xs leading-5 text-slate-600">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-slate-400" />
                    Your available features follow the permissions attached to this role.
                  </div>
                </div>
              </section>
            </div>

            <section className="overflow-hidden  border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.02]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center  bg-slate-100 text-slate-700">
                    <Fingerprint size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Permission details
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Capabilities available through your role.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {Object.entries(permissionGroups).length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(permissionGroups).map(([group, actions]) => (
                      <div
                        key={group}
                        className=" border border-slate-200 bg-white p-4"
                      >
                        <h3 className="text-sm font-semibold text-slate-800">
                          {group}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {actions.map((action, index) => (
                            <span
                              key={`${group}-${action}-${index}`}
                              className="inline-flex items-center gap-1.5  bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                            >
                              <Check size={12} className="text-emerald-700" />
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className=" border border-dashed border-slate-200 px-4 py-7 text-center">
                    <ShieldCheck size={20} className="mx-auto text-slate-400" />
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {hasPermissionDetails
                        ? "No permissions assigned"
                        : "Permission details unavailable"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {hasPermissionDetails
                        ? "This role currently has no permissions to display."
                        : "Permission information wasn’t returned for this account."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
