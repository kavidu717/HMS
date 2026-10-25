"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileBarChart,
  FlaskConical,
  Pill,
  Users,
  Wallet,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/auth.store";
import { hasPrivilege } from "@/lib/permissions";

const reports = [
  {
    title: "Patient reports",
    description: "Explore patient records, registrations, and profile details.",
    href: "/reports/patients",
    icon: Users,
    label: "Care",
    tone: "bg-emerald-50 text-emerald-700",
    privilege: "patient:read",
  },
  {
    title: "Appointment reports",
    description: "Review visit schedules, appointment activity, and status.",
    href: "/reports/appointments",
    icon: CalendarDays,
    label: "Operations",
    tone: "bg-emerald-50 text-emerald-700",
    privilege: "appointment:read",
  },
  {
    title: "Revenue reports",
    description: "Track invoices, payments, and outstanding balances.",
    href: "/reports/revenue",
    icon: Wallet,
    label: "Finance",
    tone: "bg-amber-50 text-amber-700",
    privilege: "billing:read",
  },
  {
    title: "Pharmacy reports",
    description: "See pharmacy activity and medication records in one place.",
    href: "/reports/pharmacy",
    icon: Pill,
    label: "Services",
    tone: "bg-emerald-50 text-emerald-700",
    privilege: "pharmacy:read",
  },
  {
    title: "Laboratory reports",
    description: "Review laboratory requests and test records.",
    href: "/reports/laboratory",
    icon: FlaskConical,
    label: "Diagnostics",
    tone: "bg-emerald-50 text-emerald-700",
    privilege: "laboratory:read",
  },
];

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);
  const visibleReports = reports.filter((report) =>
    hasPrivilege(user, report.privilege),
  );
  const visibleAreas = [...new Set(visibleReports.map((report) => report.label))];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              MediCore HMS <span className="text-slate-300">/</span> Insights
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Find the information your team needs across care, operations, and
              finance.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
              <FileBarChart size={19} />
            </span>
            <div>
              <p className="text-lg font-semibold leading-5 text-slate-900">
                {visibleReports.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Report areas</p>
            </div>
          </div>
        </header>

        <section className="relative isolate overflow-hidden bg-[#12392f] p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8 lg:p-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-24 -top-36 h-80 w-80 bg-teal-300/15 blur-3xl" />
            <div className="absolute -bottom-48 left-1/3 h-80 w-80 bg-emerald-400/15 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:34px_34px]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100">
                <FileBarChart size={14} />
                Report library
              </span>
              <h2 className="mt-5 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                A clearer view of your hospital operations.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-100/75 sm:text-base">
                Choose a report area to explore the records that keep your
                services moving.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {visibleAreas.map((area) => (
                  <span
                    key={area}
                    className="border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs text-emerald-50/90"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">
                    Report coverage
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {visibleReports.length} available report areas
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/[0.08] text-teal-100">
                  <ArrowRight size={17} />
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {visibleReports.map((report) => (
                  <div
                    key={report.href}
                    className="flex items-center justify-between gap-3 border border-white/10 bg-white/[0.035] px-3 py-2.5"
                  >
                    <span className="text-xs font-medium text-white">
                      {report.label}
                    </span>
                    <span className="text-right text-[10px] text-emerald-50/65">
                      {report.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="available-reports-heading">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2
                id="available-reports-heading"
                className="text-lg font-semibold text-slate-950"
              >
                Browse report areas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a category to continue.
              </p>
            </div>
            <p className="text-xs font-medium text-slate-400">
              {visibleReports.length} categories
            </p>
          </div>

          {visibleReports.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleReports.map((report, index) => {
              const Icon = report.icon;

              return (
                <Link
                  key={report.title}
                  href={report.href}
                  className="group flex min-h-52 flex-col border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-slate-900/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-11 w-11 items-center justify-center ${report.tone}`}
                    >
                      <Icon size={21} strokeWidth={1.8} />
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-slate-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-950 transition group-hover:text-emerald-800">
                      {report.title}
                    </h3>
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700"
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {report.description}
                  </p>

                  <div className="mt-auto pt-5">
                    <span className="inline-flex border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {report.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          ) : (
            <div className="border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
              <h3 className="font-semibold text-slate-900">No report areas are assigned</h3>
              <p className="mt-1 text-sm text-slate-500">You do not currently have access to a report module.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
