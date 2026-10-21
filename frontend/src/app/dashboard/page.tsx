"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  FileHeart,
  FlaskConical,
  HeartPulse,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UsersRound,
} from "lucide-react";

const workspaceLinks = [
  {
    title: "Patients",
    description: "Patient directory and profiles",
    href: "/patients",
    icon: UsersRound,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Doctors",
    description: "Browse the care team",
    href: "/doctors",
    icon: Stethoscope,
    iconStyle: "bg-teal-50 text-teal-700",
  },
  {
    title: "Appointments",
    description: "View and manage visits",
    href: "/appointments",
    icon: CalendarDays,
    iconStyle: "bg-teal-50 text-teal-700",
  },
  {
    title: "Medical records",
    description: "Access patient records",
    href: "/medical-records",
    icon: FileHeart,
    iconStyle: "bg-rose-50 text-rose-700",
  },
  {
    title: "Laboratory",
    description: "Laboratory services",
    href: "/laboratory",
    icon: FlaskConical,
    iconStyle: "bg-amber-50 text-amber-700",
  },
  {
    title: "Pharmacy",
    description: "Medication and pharmacy",
    href: "/pharmacy",
    icon: Pill,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Billing",
    description: "Billing and payments",
    href: "/billing",
    icon: CreditCard,
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Staff",
    description: "Staff directory",
    href: "/staff",
    icon: UserCog,
    iconStyle: "bg-teal-50 text-teal-700",
  },
  {
    title: "User management",
    description: "Manage accounts and access",
    href: "/users",
    icon: ShieldCheck,
    iconStyle: "bg-slate-100 text-slate-700",
  },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3  bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200/70">
          <span className="flex h-9 w-9 items-center justify-center  bg-emerald-50 text-emerald-700">
            <HeartPulse size={19} />
          </span>
          <p className="text-sm text-slate-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5  bg-emerald-600" />
              MediCore HMS <span className="text-slate-300">/</span> Overview
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Welcome back, {user.username}. Your workspace is ready.
            </p>
          </div>
        </header>

        <section className="relative isolate overflow-hidden  bg-[#12392f] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8 lg:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-24 -top-40 h-96 w-96  bg-teal-400/20 blur-3xl" />
            <div className="absolute -bottom-44 left-1/4 h-80 w-80  bg-emerald-500/20 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:36px_36px]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2  border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100">
                <HeartPulse size={14} />
                Your care workspace
              </div>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Everything your team needs, in one place.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75 sm:text-base">
                Move between care services and manage your work from a single,
                organized workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5  bg-white/[0.08] px-3 py-1.5 text-xs text-emerald-50/90">
                  <Check size={13} className="text-teal-200" />
                  Role-based access
                </span>
                <span className="inline-flex items-center gap-1.5  bg-white/[0.08] px-3 py-1.5 text-xs text-emerald-50/90">
                  <Check size={13} className="text-teal-200" />
                  Connected services
                </span>
              </div>
            </div>

            <div className=" border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">
                Signed in as
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center  bg-gradient-to-br from-teal-200 to-emerald-300 text-lg font-semibold text-[#12392f] shadow-inner shadow-white/30">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {user.username}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-emerald-100/70">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-sm text-emerald-50/75">
                  <ShieldCheck size={16} className="text-teal-200" />
                  Account role
                </div>
                <span className="max-w-36 truncate  bg-teal-200/10 px-3 py-1 text-xs font-medium text-teal-100">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="workspace-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                id="workspace-heading"
                className="text-lg font-semibold tracking-tight text-slate-900"
              >
                Explore your workspace
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Jump directly to a hospital service.
              </p>
            </div>
            <span className="hidden text-xs font-medium text-slate-400 sm:block">
              {workspaceLinks.length} services
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workspaceLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-24 items-center gap-4  border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 sm:p-5"
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center  ${item.iconStyle}`}
                  >
                    <Icon size={21} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-800 transition group-hover:text-emerald-800">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight
                    size={17}
                    className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        <section className=" border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.02] sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center  bg-emerald-50 text-emerald-700">
                <ShieldCheck size={19} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Account details
                </h2>
                <p className="mt-1 max-w-lg text-sm leading-5 text-slate-500">
                  Your profile information for this account.
                </p>
              </div>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:min-w-[20rem]">
              <div>
                <p className="text-xs font-medium text-slate-400">Email</p>
                <p className="mt-1 break-all font-medium text-slate-700">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">User ID</p>
                <p className="mt-1 break-all font-medium text-slate-700">
                  {user.id}
                </p>
              </div>
            </div>
          </div>

        </section>
      </div>
    </DashboardLayout>
  );
}
