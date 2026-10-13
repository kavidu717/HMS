
"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/axios";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  KeyRound,
  UserPlus,
  Users,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type Role = {
  id: string;
  name: string;
  description: string | null;
};

type CreatedUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function UsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get("/users/roles");

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to load roles"
          );
        }

        const fetchedRoles: Role[] = response.data.data;

        setRoles(fetchedRoles);

        if (fetchedRoles.length > 0) {
          setRoleId(fetchedRoles[0].id);
        }
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to load roles"
          : "Failed to load roles";

        toast.error(message);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingUser(true);
    setCreatedUser(null);

    try {
      const response = await api.post("/users", {
        username: username.trim(),
        email: email.trim(),
        roleId,
      });

      const user: CreatedUser = response.data.data;

      setCreatedUser(user);
      toast.success(response.data.message || "User created successfully");

      setUsername("");
      setEmail("");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Failed to create user"
        : "Failed to create user";

      toast.error(message);
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Workspace <span className="text-slate-300">/</span> Access
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              User management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Create secure accounts for your team and choose the access each
              person needs.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <ShieldCheck size={15} className="text-blue-700" />
            Role-based access
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,0.8fr)] xl:gap-6">
          <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    Create a user account
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Add their details and assign a role to send an invitation.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-5 px-5 py-5 sm:px-7 sm:py-6"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <Users
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={30}
                      autoComplete="off"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="e.g. alex.morgan"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Use 3–30 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Work email
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      maxLength={100}
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@hospital.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    We’ll send the account invitation here.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Access role
                  </label>
                  {!loadingRoles && roles.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {roles.length} {roles.length === 1 ? "role" : "roles"} available
                    </span>
                  )}
                </div>
                <div className="relative">
                  <ShieldCheck
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    id="role"
                    name="roleId"
                    required
                    value={roleId}
                    disabled={loadingRoles || roles.length === 0}
                    onChange={(event) => setRoleId(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {loadingRoles ? (
                      <option value="">Loading roles…</option>
                    ) : roles.length === 0 ? (
                      <option value="">No roles available</option>
                    ) : (
                      roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name.replaceAll("_", " ")}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
                  <CircleHelp
                    size={14}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  {roles.find((role) => role.id === roleId)?.description ||
                    "The selected role determines which parts of the system this person can access."}
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  The user will set their password from the invitation link.
                </p>
                <button
                  type="submit"
                  disabled={
                    creatingUser ||
                    loadingRoles ||
                    roles.length === 0 ||
                    !roleId
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create account
                      <ArrowUpRight size={15} className="ml-0.5 opacity-75" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="overflow-hidden rounded-[24px] bg-[#102c49] p-5 text-white shadow-lg shadow-slate-900/10 sm:p-6">
            <div className="flex items-center gap-2 text-cyan-200">
              <KeyRound size={16} />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">
                Account setup
              </p>
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              A secure start for every teammate.
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-100/70">
              New users activate their account themselves, so their password
              stays private from the start.
            </p>

            <ol className="mt-7 space-y-0">
              {[
                {
                  title: "Add account details",
                  description: "Enter a username and work email.",
                },
                {
                  title: "Choose access",
                  description: "Assign the role that fits their work.",
                },
                {
                  title: "User activates account",
                  description: "They follow the invitation link to set a password.",
                },
              ].map((step, index) => (
                <li key={step.title} className="relative flex gap-3 pb-6 last:pb-0">
                  {index < 2 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-white/15"
                    />
                  )}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-xs font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">
                    <span className="block text-sm font-medium text-white">
                      {step.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-blue-100/65">
                      {step.description}
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-7 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
              <Check size={16} className="mt-0.5 shrink-0 text-cyan-200" />
              <p className="text-xs leading-5 text-blue-50/80">
                Access is controlled by the role selected above and can be
                reviewed by your administrators.
              </p>
            </div>
          </aside>
        </div>

        {createdUser && (
          <section
            role="status"
            className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Check size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-emerald-950">
                  Account created
                </h2>
                <p className="mt-1 text-sm leading-5 text-emerald-800">
                  An invitation email was requested for {createdUser.email}.
                </p>
              </div>
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-emerald-200/80 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-medium text-emerald-700">Username</dt>
                <dd className="mt-1 break-words font-medium text-emerald-950">
                  {createdUser.username}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-emerald-700">Assigned role</dt>
                <dd className="mt-1 capitalize font-medium text-emerald-950">
                  {createdUser.role.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-emerald-700">Account status</dt>
                <dd className="mt-1 capitalize font-medium text-emerald-950">
                  {createdUser.status.replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-emerald-700">User ID</dt>
                <dd className="mt-1 break-all font-mono text-xs font-medium text-emerald-950">
                  {createdUser.id}
                </dd>
              </div>
            </dl>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
