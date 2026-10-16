"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Mail,
  ShieldCheck,
  UserRound,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

type UserDetails = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "Never logged in";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
};

const getStatusStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";

    case "INACTIVE":
      return "bg-slate-100 text-slate-600 ring-slate-500/20";

    case "SUSPENDED":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";

    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
};

export default function UserDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const userId = params.id;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/users/${userId}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(
          response.data.message || "Failed to retrieve user details."
        );
      }

      setUser(response.data.data);
    } catch (err) {
      let message = "Failed to load user details.";

      if (axios.isAxiosError(err)) {
        message =
          err.response?.data?.message ||
          "Unable to load user details. Please try again.";
      } else if (err instanceof Error) {
        message = err.message;
      }

      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const handleBack = () => {
    router.push("/users");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              Back to User Management
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View account information and activity.
            </p>
          </div>

          {!loading && !error && user && (
            <button
              type="button"
              onClick={() => void fetchUser()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2  border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex min-h-72 flex-col items-center justify-center  border border-slate-200 bg-white">
            <Loader2
              size={32}
              className="animate-spin text-indigo-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading user details...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className=" border border-rose-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center  bg-rose-50 text-rose-600">
              <AlertCircle size={24} />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              Unable to load user
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              {error}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void fetchUser()}
                className="inline-flex items-center gap-2  bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <RefreshCw size={16} />
                Try Again
              </button>

              <button
                type="button"
                onClick={handleBack}
                className=" border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to Users
              </button>
            </div>
          </div>
        )}

        {/* User details */}
        {!loading && !error && user && (
          <>
            {/* Profile card */}
            <section className="overflow-hidden  border border-slate-200 bg-white shadow-sm">
              <div className="h-28 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600" />

              <div className="px-6 pb-6">
                <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center  border-4 border-white bg-indigo-50 text-2xl font-bold uppercase text-indigo-700 shadow-sm">
                      {user.username?.charAt(0) || "U"}
                    </div>

                    <div className="pb-1">
                      <h2 className="text-xl font-bold text-slate-900">
                        {user.username}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center  px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                      user.status
                    )}`}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </section>

            {/* Details grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Account information */}
              <section className=" border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-10 w-10 items-center justify-center  bg-indigo-50 text-indigo-600">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Account Information
                    </h3>

                    <p className="text-sm text-slate-500">
                      Basic account details
                    </p>
                  </div>
                </div>

                <div className="space-y-5 pt-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      User ID
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-800">
                      {user.id}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <UserRound size={14} />
                      Username
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {user.username}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <Mail size={14} />
                      Email Address
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-800">
                      {user.email}
                    </p>
                  </div>
                </div>
              </section>

              {/* Role and access */}
              <section className=" border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-10 w-10 items-center justify-center  bg-violet-50 text-violet-600">
                    <ShieldCheck size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Role & Access
                    </h3>

                    <p className="text-sm text-slate-500">
                      Assigned account role
                    </p>
                  </div>
                </div>

                <div className="space-y-5 pt-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Assigned Role
                    </p>

                    <div className="mt-2">
                      <span className="inline-flex  bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                        {user.role.replaceAll("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Account Status
                    </p>

                    <div className="mt-2">
                      <span
                        className={`inline-flex  px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <div className=" bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <Users
                        size={18}
                        className="mt-0.5 text-slate-500"
                      />

                      <p className="text-sm leading-6 text-slate-600">
                        The user's available system features depend on the
                        privileges assigned to this role.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account activity */}
              <section className=" border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="flex h-10 w-10 items-center justify-center  bg-emerald-50 text-emerald-600">
                    <Clock size={20} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Account Activity
                    </h3>

                    <p className="text-sm text-slate-500">
                      Account creation and login information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 pt-5 sm:grid-cols-2">
                  <div className=" border border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CalendarDays size={17} />

                      <p className="text-sm font-medium">Created At</p>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>

                  <div className=" border border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={17} />

                      <p className="text-sm font-medium">Last Login</p>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {formatDate(user.lastLoginAt)}
                    </p>
                  </div>

                  <div className=" border border-slate-100 p-4 sm:col-span-2">
                    <div className="flex items-center gap-2 text-slate-500">
                      <CalendarDays size={17} />

                      <p className="text-sm font-medium">Last Updated</p>
                    </div>

                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {formatDate(user.updatedAt)}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}