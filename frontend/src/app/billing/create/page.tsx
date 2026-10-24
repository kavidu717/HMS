import Link from "next/link";
import { ArrowLeft, FilePlus2, ShieldCheck } from "lucide-react";
import { InvoiceForm } from "@/components/billing/invoice-form";
import DashboardLayout from "@/components/layout/dashboard-layout";

export default function CreateInvoicePage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <Link
            href="/billing"
            className="mb-5 inline-flex items-center gap-2 py-1 text-sm font-medium text-slate-500 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10"
          >
            <ArrowLeft size={16} />
            Billing overview
          </Link>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                <span className="h-1.5 w-1.5 bg-emerald-600" />
                Finance workspace <span className="text-slate-300">/</span> New invoice
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Create an invoice
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Choose an active patient, add the charges, and review the total before saving.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 border border-emerald-100 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <ShieldCheck size={15} className="text-emerald-700" />
              Invoice number assigned on save
            </div>
          </div>
        </header>

        <section className="relative isolate overflow-hidden bg-[#12392f] px-5 py-5 text-white shadow-lg shadow-emerald-950/10 sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -right-16 -top-28 h-64 w-64 bg-teal-300/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:30px_30px]" />
          </div>
          <div className="relative flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-white/10 text-teal-100">
              <FilePlus2 size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">A clear, itemized record</p>
              <p className="mt-1 text-xs leading-5 text-emerald-50/70 sm:text-sm">
                Add each service separately. The invoice total updates as you work.
              </p>
            </div>
          </div>
        </section>

        <InvoiceForm />
      </div>
    </DashboardLayout>
  );
}
