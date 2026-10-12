"use client";

import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Eye,
  EyeOff,
  HeartPulse,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setUser = useAuthStore((state) => state.setUser);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { username, password });

      if (response.data.success) {
        const user = response.data.data.user;

       setUser(user);

     toast.success(response.data.message);
     } else {
      toast.error(response.data.message);
     } 

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Unable to sign in. Please try again.",
        );
      } else {
        toast.error("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="relative isolate flex min-h-[34rem] flex-col justify-between overflow-hidden bg-[#0b233b] px-6 py-8 text-white sm:px-10 sm:py-10 lg:min-h-screen lg:px-14 lg:py-12 xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -bottom-48 -left-32 h-[34rem] w-[34rem] rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="absolute -right-20 top-1/3 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-[38%] h-48 w-48 rounded-full border border-white/10" />
        </div>

        <a href="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0b233b] shadow-lg shadow-black/10">
            <HeartPulse size={23} strokeWidth={2.3} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">
              MediCore
            </span>
            <span className="block text-xs tracking-wide text-blue-100/70">
              Hospital Management System
            </span>
          </span>
        </a>

        <div className="relative z-10 my-12 max-w-xl lg:my-0 lg:py-8">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/[0.07] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
            Care, connected
          </p>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.4rem] xl:text-6xl">
            Make room for <span className="text-cyan-200">better care.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/75 sm:text-base">
            Bring people, appointments and patient information together in one
            clear, secure workspace.
          </p>

          <div className="mt-9 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">
                  Connected workflow
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  Care in one clear view
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1.5 text-[10px] font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                In sync
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_1.1rem_1fr_1.1rem_1fr] items-center gap-1">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-100">
                  <UsersRound size={18} />
                </span>
                <span className="text-[10px] text-blue-50/75 sm:text-[11px]">
                  People
                </span>
              </div>
              <span className="mb-5 h-px bg-gradient-to-r from-cyan-200/50 to-white/20" />
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-100">
                  <CalendarDays size={18} />
                </span>
                <span className="text-[10px] text-blue-50/75 sm:text-[11px]">
                  Appointments
                </span>
              </div>
              <span className="mb-5 h-px bg-gradient-to-r from-white/20 to-cyan-200/50" />
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-cyan-100">
                  <ClipboardList size={18} />
                </span>
                <span className="text-[10px] text-blue-50/75 sm:text-[11px]">
                  Records
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-100/50">
          MediCore HMS <span className="mx-2 text-blue-100/25">•</span> For
          authorized hospital staff
        </p>
      </section>

      <section className="relative flex min-h-[38rem] items-center justify-center overflow-hidden bg-[#f5f8fc] px-5 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl"
        />
        <div className="relative w-full max-w-[44rem] p-7 sm:p-10">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700">
            <LockKeyhole size={13} strokeWidth={2.2} />
            Staff portal
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.1rem]">
              Welcome back
            </h2>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">
              Sign in with your hospital account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <UserRound
                  size={18}
                  className="shrink-0 text-slate-400 transition group-focus-within:text-blue-600"
                />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  minLength={3}
                  required
                  className="min-w-0 w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <LockKeyhole
                  size={18}
                  className="shrink-0 text-slate-400 transition group-focus-within:text-blue-600"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="min-w-0 w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="rounded-md p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-[#104dcc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-xs leading-5 text-slate-500">
              This portal is for authorized hospital personnel. If you need
              access, contact your system administrator.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
