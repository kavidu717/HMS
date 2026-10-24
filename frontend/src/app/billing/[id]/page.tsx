import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { InvoiceDetails } from "@/components/billing/invoice-details";
import DashboardLayout from "@/components/layout/dashboard-layout";

interface InvoiceDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoiceDetailsPage({
  params,
}: InvoiceDetailsPageProps) {
  const { id } = await params;

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

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                <span className="h-1.5 w-1.5 bg-emerald-600" />
                Finance workspace <span className="text-slate-300">/</span> Invoices
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Invoice details
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Review the patient, itemized charges, and payment activity for this invoice.
              </p>
            </div>

            <span className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <FileText size={15} className="text-emerald-700" />
              Invoice record
            </span>
          </div>
        </header>

        <InvoiceDetails invoiceId={id} />
      </div>
    </DashboardLayout>
  );
}
