import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText, ReceiptText } from "lucide-react";
import { BillingStats } from "@/components/billing/billing-stats";
import { InvoiceTable } from "@/components/billing/invoice-table";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="billing-page mx-auto max-w-7xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Finance workspace <span className="text-slate-300">/</span> Billing
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Billing overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Keep patient invoices, payments and outstanding balances in clear view.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 border border-emerald-100 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
            <span className="flex h-6 w-6 items-center justify-center bg-emerald-50 text-emerald-700">
              <ReceiptText size={13} />
            </span>
            Patient accounts
          </div>
        </header>

        <section className="relative isolate overflow-hidden bg-[#12392f] px-6 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-8 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-16 -top-40 h-80 w-80 bg-teal-300/15 blur-3xl" />
            <div className="absolute -bottom-48 left-1/3 h-80 w-80 bg-emerald-400/15 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]" />
          </div>

          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100">
                <FileText size={13} />
                Patient billing
              </div>
              <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                A clearer picture of every payment.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/70 sm:text-base">
                Review charges and collections together, so every account is easier to follow.
              </p>
              <Link
                href="#invoices"
                className="mt-6 inline-flex items-center gap-2 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              >
                Browse invoices
                <ArrowDown size={16} />
              </Link>
            </div>

            <div className="hidden w-full max-w-xs shrink-0 md:block">
              <div className="border border-white/10 bg-white/[0.07] p-5 shadow-lg shadow-black/5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center bg-teal-200/10 text-teal-100">
                    <ReceiptText size={21} />
                  </span>
                  <ArrowUpRight size={17} className="text-emerald-100/50" />
                </div>
                <p className="mt-5 text-sm font-semibold text-white">
                  Every account, in one place
                </p>
                <p className="mt-1.5 text-xs leading-5 text-emerald-50/65">
                  Find invoices, check payment progress and review open balances.
                </p>
                <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
                  <span className="h-1.5 w-10 bg-teal-200/80" />
                  <span className="h-1.5 w-6 bg-white/20" />
                  <span className="h-1.5 w-4 bg-white/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <BillingStats />
        <InvoiceTable />
      </div>
    </DashboardLayout>
  );
}
