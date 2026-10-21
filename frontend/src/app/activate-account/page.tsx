"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  HeartPulse,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";

export default function ActivateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordMeetsLength = password.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleActivate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error("Invitation token is missing. Please use the email link.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/activate-account", {
        token,
        password,
      });

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Account activation failed."
        );
      }

      toast.success("Account activated successfully!");
      router.replace("/login");
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || "Account activation failed."
        : error instanceof Error
          ? error.message
          : "Account activation failed.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f5f8fc] lg:grid-cols-[minmax(21rem,0.9fr)_minmax(0,1.1fr)]">
      <section className="relative isolate flex min-h-[22rem] flex-col justify-between overflow-hidden bg-[#0d3329] px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-screen lg:px-12 lg:py-10 xl:px-16 xl:py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -right-36 -top-40 h-[30rem] w-[30rem]  bg-teal-400/15 blur-3xl" />
          <div className="absolute -bottom-48 -left-36 h-[34rem] w-[34rem]  bg-emerald-600/25 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="absolute -right-20 top-1/3 h-72 w-72  border border-white/10" />
          <div className="absolute -right-8 top-[38%] h-48 w-48  border border-white/10" />
        </div>

        <Link href="/" className="relative z-10 flex w-fit items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center  bg-white text-[#0d3329] shadow-lg shadow-black/10">
            <HeartPulse size={23} strokeWidth={2.3} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">
              MediCore
            </span>
            <span className="block text-xs tracking-wide text-emerald-100/70">
              Hospital Management System
            </span>
          </span>
        </Link>

        <div className="relative z-10 my-10 max-w-xl lg:my-0 lg:py-10">
          <p className="mb-5 inline-flex items-center gap-2  border border-teal-200/20 bg-teal-100/[0.07] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100 sm:text-[11px]">
            <span className="h-1.5 w-1.5  bg-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            Your invitation is ready
          </p>
          <h1 className="max-w-lg text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.4rem]">
            A secure start to <span className="text-teal-200">better care.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-emerald-100/75 sm:mt-5 sm:text-base">
            Set up your account to join your hospital team’s connected care
            workspace.
          </p>

          <div className="mt-7  border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:mt-9 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
                  Account setup
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  One final step to get started
                </p>
              </div>
              <span className=" border border-teal-200/15 bg-teal-200/10 px-2.5 py-1.5 text-[10px] font-semibold text-teal-100">
                STEP 2 OF 2
              </span>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_1.2rem_1fr] items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center  bg-emerald-300/10 text-emerald-200">
                  <Mail size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] text-emerald-50/55">Step 1</span>
                  <span className="block truncate text-xs font-medium text-emerald-50/80 sm:text-sm">
                    Invitation sent
                  </span>
                </span>
              </div>
              <span className="h-px bg-gradient-to-r from-emerald-200/50 to-teal-200/50" />
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center  border border-teal-200/20 bg-teal-200/10 text-teal-100">
                  <KeyRound size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] text-teal-100/65">Step 2</span>
                  <span className="block truncate text-xs font-medium text-white sm:text-sm">
                    Set password
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 flex items-center gap-2 text-xs text-emerald-100/55">
          <ShieldCheck size={15} className="text-teal-200/75" />
          Your password stays private to your account.
        </p>
      </section>

      <section className="relative flex min-h-[38rem] items-center justify-center overflow-hidden px-5 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-36 h-[28rem] w-[28rem]  bg-emerald-100/70 blur-3xl"
        />

        <div className="relative w-full max-w-[30rem]">
          {!token ? (
            <div className=" border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/[0.06] sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center  bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <ShieldAlert size={23} />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.15em] text-rose-700">
                Invitation link issue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                This link is incomplete
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The invitation token is missing. Open the full activation link
                from your invitation email, or contact your administrator for a
                new invitation.
              </p>
              <Link
                href="/login"
                className="mt-7 inline-flex w-full items-center justify-center gap-2  bg-[#047857] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-[#065f46] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
              >
                Go to sign in
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="mb-6 inline-flex items-center gap-2  border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700">
                  <ShieldCheck size={14} strokeWidth={2.2} />
                  Secure account setup
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.6rem]">
                  Create your password
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                  Choose a password to activate your MediCore account and join
                  your team.
                </p>
              </div>

              <form onSubmit={handleActivate} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    New password
                  </label>
                  <div className="group flex items-center gap-3  border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                    <LockKeyhole
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400 transition group-focus-within:text-emerald-700"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      aria-describedby="password-help"
                      className="min-w-0 w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className=" p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p
                    id="password-help"
                    className={`mt-2 flex items-center gap-1.5 text-xs ${
                      passwordMeetsLength ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {passwordMeetsLength ? (
                      <Check size={14} />
                    ) : (
                      <span className="h-1.5 w-1.5  bg-slate-400" />
                    )}
                    At least 8 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>
                  <div
                    className={`group flex items-center gap-3  border bg-white px-4 transition focus-within:ring-4 ${
                      passwordsMismatch
                        ? "border-rose-300 focus-within:border-rose-400 focus-within:ring-rose-500/10"
                        : "border-slate-200 focus-within:border-emerald-500 focus-within:ring-emerald-500/10"
                    }`}
                  >
                    <LockKeyhole
                      size={18}
                      aria-hidden="true"
                      className="shrink-0 text-slate-400 transition group-focus-within:text-emerald-700"
                    />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Enter it once more"
                      aria-invalid={passwordsMismatch}
                      aria-describedby="confirm-password-help"
                      className="min-w-0 w-full bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((current) => !current)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirmation password"
                          : "Show confirmation password"
                      }
                      className=" p-1 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  <p
                    id="confirm-password-help"
                    aria-live="polite"
                    className={`mt-2 min-h-4 text-xs ${
                      passwordsMatch
                        ? "text-emerald-700"
                        : passwordsMismatch
                          ? "text-rose-600"
                          : "text-slate-500"
                    }`}
                  >
                    {passwordsMatch
                      ? "Passwords match."
                      : passwordsMismatch
                        ? "These passwords don’t match yet."
                        : "Enter the same password again to confirm."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  aria-busy={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2  bg-[#047857] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/15 transition hover:bg-[#065f46] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Activating account…
                    </>
                  ) : (
                    <>
                      Activate account
                      <ArrowRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 flex items-start gap-3  border border-slate-200/80 bg-white/75 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                  <CircleCheck size={17} />
                </span>
                <p className="pt-0.5 text-xs leading-5 text-slate-500">
                  After activation, sign in with your username and the password
                  you create here.
                </p>
              </div>

              <p className="mt-7 text-center text-xs text-slate-500">
                Already activated?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-700 underline-offset-4 transition hover:text-emerald-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Go to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
