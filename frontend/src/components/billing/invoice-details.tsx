
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  Phone,
  Printer,
  RefreshCw,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { PaymentForm } from "@/components/billing/payment-form";
import { useAuthStore } from "@/store/auth.store";
import { hasPrivilege } from "@/lib/permissions";

type Amount = number | string;

interface InvoiceItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: Amount;
  amount: Amount;
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: Amount;
  paymentMethod: string;
  referenceNumber?: string | null;
  paidAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  invoiceDate: string;
  totalAmount: Amount;
  paidAmount: Amount;
  balanceAmount: Amount;
  status: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    email?: string | null;
  };
  items: InvoiceItem[];
  payments: Payment[];
}

interface InvoiceResponse {
  success: boolean;
  data: Invoice;
}

interface InvoiceDetailsProps {
  invoiceId: string;
}

const formatCurrency = (amount: Amount) =>
  `Rs. ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

  return parsedDate.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatDateTime = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

  return parsedDate.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case "PAID":
      return {
        label: "Paid in full",
        className: "border border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: CheckCircle2,
      };
    case "PARTIALLY_PAID":
      return {
        label: "Partially paid",
        className: "border border-amber-200 bg-amber-50 text-amber-800",
        icon: Clock3,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "border border-slate-200 bg-slate-100 text-slate-600",
        icon: XCircle,
      };
    case "UNPAID":
    default:
      return {
        label: "Payment due",
        className: "border border-rose-200 bg-rose-50 text-rose-800",
        icon: CircleAlert,
      };
  }
};

export function InvoiceDetails({ invoiceId }: InvoiceDetailsProps) {
  const user = useAuthStore((state) => state.user);
  const canRecordPayment = hasPrivilege(user, "billing:create");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<InvoiceResponse>(
        `/billing/invoices/${invoiceId}`,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error("Invoice details were not returned.");
      }

      setInvoice(response.data.data);
    } catch {
      setError("We couldn’t load this invoice. Please try again.");
      toast.error("Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Loading invoice details">
        <div className="h-52 animate-pulse border border-slate-200 bg-slate-100" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-6">
            <div className="h-40 animate-pulse border border-slate-200 bg-slate-100" />
            <div className="h-72 animate-pulse border border-slate-200 bg-slate-100" />
          </div>
          <div className="h-64 animate-pulse border border-slate-200 bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="border border-rose-200 bg-white px-6 py-12 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center bg-rose-50 text-rose-700">
          <AlertCircle size={22} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-slate-950">
          Invoice details unavailable
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {error || "This invoice could not be found."}
        </p>
        <button
          type="button"
          onClick={() => void fetchInvoice()}
          className="mt-5 inline-flex h-10 items-center gap-2 border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  const status = getStatus(invoice.status);
  const StatusIcon = status.icon;
  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidAmount);
  const balance = Number(invoice.balanceAmount);
  const paymentProgress = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const patientName = invoice.patient
    ? `${invoice.patient.firstName} ${invoice.patient.lastName}`.trim()
    : `Patient #${invoice.patientId}`;

  return (
    <div className="invoice-print-area space-y-6">
      <section className="relative isolate overflow-hidden bg-[#12392f] px-5 py-6 text-white shadow-lg shadow-emerald-950/10 sm:px-7 sm:py-7 print:overflow-visible print:bg-white print:text-black print:shadow-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden"
        >
          <div className="absolute -right-24 -top-40 h-80 w-80 bg-teal-300/15 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>

        <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/10 bg-white/[0.08] text-teal-100 print:hidden">
              <FileText size={22} />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/75 print:text-black">
                Invoice record
              </p>

              <h2 className="mt-1 break-all text-2xl font-semibold tracking-tight sm:text-3xl">
                {invoice.invoiceNumber}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-emerald-50/70 print:text-black">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Issued {formatDate(invoice.invoiceDate)}
                </span>

                <span className="text-white/25 print:text-black">
                  Invoice ID {invoice.id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-5 md:min-w-64 md:border-l md:border-t-0 md:pl-7 md:pt-0 print:border-0 print:pt-0">
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold print:border print:border-black print:bg-white print:text-black ${status.className}`}
              >
                <StatusIcon size={14} />
                {status.label}
              </span>

              <button
                type="button"
                onClick={() => window.print()}
                className="print:hidden inline-flex h-10 items-center justify-center gap-2 border border-white bg-white px-3.5 text-sm font-semibold text-[#12392f] shadow-sm transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
              >
                <Printer size={16} />
                Print invoice
              </button>
            </div>

            <div className="md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100/60 print:text-black">
                Amount due
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-white print:text-black">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] print:block print:space-y-6">
        <div className="space-y-6">
          <section className="border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:break-inside-avoid print:border-slate-300 print:shadow-none">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700 print:hidden">
                <UserRound size={19} />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Patient details
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  The patient associated with this invoice.
                </p>
              </div>
            </div>

            <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Patient name
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-slate-900">
                  {patientName}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Patient ID
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-700">
                  {invoice.patient?.id ?? invoice.patientId}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Phone
                </dt>
                <dd className="mt-1.5 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Phone size={14} className="text-slate-400 print:hidden" />
                  {invoice.patient?.phone || "Not provided"}
                </dd>
              </div>

              <div className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Email
                </dt>
                <dd className="mt-1.5 break-all text-sm font-medium text-slate-700">
                  {invoice.patient?.email || "Not provided"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:break-inside-avoid print:overflow-visible print:border-slate-300 print:shadow-none">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 print:text-black">
                  Itemized charges
                </p>

                <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
                  Invoice items
                </h2>
              </div>

              <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 print:border-slate-300 print:bg-white print:text-black">
                {invoice.items.length}{" "}
                {invoice.items.length === 1 ? "item" : "items"}
              </span>
            </div>

            {invoice.items.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">
                No invoice items found.
              </p>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[650px] text-sm print:min-w-0">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 print:bg-white print:text-black">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 sm:px-6">
                        Description
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right">
                        Qty
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right">
                        Unit price
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-right sm:px-6">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {invoice.items.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/70 print:break-inside-avoid"
                      >
                        <td className="px-5 py-4 font-medium text-slate-800 sm:px-6">
                          {item.description}
                        </td>

                        <td className="px-4 py-4 text-slate-500">
                          {formatLabel(item.category)}
                        </td>

                        <td className="px-4 py-4 text-right tabular-nums text-slate-600">
                          {item.quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-slate-600">
                          {formatCurrency(item.unitPrice)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-slate-900 sm:px-6">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6 print:bg-white">
              <div className="flex w-full max-w-xs items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-500 print:text-black">
                  Invoice total
                </span>

                <span className="text-base font-semibold tabular-nums text-slate-950">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </section>

          <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:break-inside-auto print:overflow-visible print:border-slate-300 print:shadow-none">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700 print:hidden">
                <CreditCard size={18} />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Payment history
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {invoice.payments.length}{" "}
                  {invoice.payments.length === 1 ? "payment" : "payments"} recorded
                </p>
              </div>
            </div>

            {invoice.payments.length === 0 ? (
              <div className="px-6 py-9 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-500 print:hidden">
                  <CreditCard size={18} />
                </span>

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No payments recorded yet
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Recorded payments will appear in this section.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full min-w-[620px] text-sm print:min-w-0">
                  <thead className="border-b border-slate-100 bg-slate-50/70 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 print:bg-white print:text-black">
                    <tr>
                      <th scope="col" className="px-5 py-3.5 sm:px-6">
                        Payment
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Date
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Method
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Reference
                      </th>
                      <th scope="col" className="px-5 py-3.5 text-right sm:px-6">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {invoice.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition-colors hover:bg-slate-50/70 print:break-inside-avoid"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800 sm:px-6">
                          {payment.paymentNumber}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                          {formatDateTime(payment.paidAt)}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatLabel(payment.paymentMethod)}
                        </td>

                        <td className="px-4 py-4 text-slate-500">
                          {payment.referenceNumber || "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-emerald-800 sm:px-6 print:text-black">
                          {formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 print:static print:space-y-4">
          <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025] print:break-inside-avoid print:overflow-visible print:border-slate-300 print:shadow-none">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700 print:hidden">
                <Wallet size={19} />
              </span>

              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Payment summary
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  All amounts in LKR
                </p>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Paid</span>

                  <span className="font-semibold tabular-nums text-emerald-800 print:text-black">
                    {formatCurrency(paid)}
                  </span>
                </div>

                <div
                  className="mt-3 h-2 w-full bg-slate-100 print:hidden"
                  role="progressbar"
                  aria-label="Invoice amount paid"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(paymentProgress)}
                >
                  <div
                    className="h-full bg-emerald-600 transition-[width] duration-500"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400 print:hidden">
                  {Math.round(paymentProgress)}% of invoice paid
                </p>
              </div>

              <dl className="space-y-3 border-y border-slate-100 py-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-slate-500">Invoice total</dt>
                  <dd className="font-medium tabular-nums text-slate-800">
                    {formatCurrency(total)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-slate-500">Paid to date</dt>
                  <dd className="font-medium tabular-nums text-emerald-800 print:text-black">
                    {formatCurrency(paid)}
                  </dd>
                </div>
              </dl>

              <div className="border-l-2 border-amber-400 bg-amber-50 px-4 py-3 print:border-slate-400 print:bg-white">
                <p className="text-xs font-medium text-amber-900 print:text-black">
                  Outstanding balance
                </p>

                <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-amber-950 print:text-black">
                  {formatCurrency(balance)}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <CreditCard size={13} className="text-slate-400 print:hidden" />
                {invoice.payments.length} payment records
              </div>
            </div>
          </section>

          <div className="flex items-start gap-3 border border-slate-200 bg-slate-50 p-4 print:hidden">
            <FileText size={16} className="mt-0.5 shrink-0 text-slate-500" />
            <p className="text-xs leading-5 text-slate-600">
              This invoice was issued on {formatDate(invoice.invoiceDate)} for{" "}
              {patientName}.
            </p>
          </div>

          {canRecordPayment && <div className="print:hidden">
            <PaymentForm
              invoiceId={invoice.id}
              balanceAmount={balance}
              isCancelled={invoice.status.toUpperCase() === "CANCELLED"}
              onPaymentSuccess={() => {
                void fetchInvoice();
              }}
            />
          </div>}
        </aside>
      </div>
    </div>
  );
}
