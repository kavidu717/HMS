"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Wallet,
} from "lucide-react";
import api from "@/lib/axios";

interface PatientInvoice {
  id: string | number;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  status: string;
}

interface PatientInvoicesResponse {
  success: boolean;
  message?: string;
  data: PatientInvoice[];
}

interface PatientInvoicesProps {
  patientId: string;
}

const formatCurrency = (amount: number | string) =>
  `Rs. ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) => {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatus = (status: string) => {
  switch (status.toUpperCase()) {
    case "PAID":
      return {
        label: "Paid",
        className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: CheckCircle2,
      };
    case "PARTIALLY_PAID":
      return {
        label: "Partially paid",
        className: "border-amber-200 bg-amber-50 text-amber-800",
        icon: Clock3,
      };
    case "UNPAID":
      return {
        label: "Payment due",
        className: "border-rose-200 bg-rose-50 text-rose-800",
        icon: CircleAlert,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "border-slate-200 bg-slate-100 text-slate-600",
        icon: Ban,
      };
    default:
      return {
        label: status.replaceAll("_", " "),
        className: "border-slate-200 bg-slate-100 text-slate-600",
        icon: CircleAlert,
      };
  }
};

export function PatientInvoices({ patientId }: PatientInvoicesProps) {
  const [invoices, setInvoices] = useState<PatientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInvoices = useCallback(async () => {
    if (!patientId) {
      setInvoices([]);
      setError("Patient ID is required.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get<PatientInvoicesResponse>(
        `/billing/patients/${patientId}/invoices`,
      );

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error("Invalid response received from the server.");
      }

      setInvoices(response.data.data);
    } catch {
      setError("Unable to load this patient’s invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const totalBilled = invoices.reduce(
    (total, invoice) => total + Number(invoice.totalAmount),
    0,
  );
  const totalPaid = invoices.reduce(
    (total, invoice) => total + Number(invoice.paidAmount),
    0,
  );
  const totalBalance = invoices.reduce(
    (total, invoice) => total + Number(invoice.balanceAmount),
    0,
  );

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading patient invoices">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
        <div className="space-y-4 border border-slate-200 bg-white p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-4">
              <div className="h-3 w-28 bg-slate-100" />
              <div className="h-3 flex-1 bg-slate-100" />
              <div className="h-3 w-24 bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-rose-900">
            Invoice history unavailable
          </p>
          <p className="mt-1 text-sm text-rose-800">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchInvoices()}
          disabled={loading}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-rose-200 bg-white px-3.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Try again
        </button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center bg-white text-slate-500 shadow-sm">
          <FileText size={20} />
        </span>
        <h3 className="mt-3 text-sm font-semibold text-slate-900">
          No invoices for this patient yet
        </h3>
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
          New invoices created for this patient will appear here with their payment status.
        </p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Invoices",
      value: invoices.length.toLocaleString(),
      note: "Patient invoice records",
      icon: FileText,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total billed",
      value: formatCurrency(totalBilled),
      note: "Amount invoiced",
      icon: Wallet,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total paid",
      value: formatCurrency(totalPaid),
      note: "Payments received",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Balance due",
      value: formatCurrency(totalBalance),
      note: "Awaiting payment",
      icon: CircleAlert,
      iconClass: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    {card.label}
                  </p>
                  <p
                    className="mt-2 truncate text-lg font-semibold tracking-tight tabular-nums text-slate-950"
                    title={card.value}
                  >
                    {card.value}
                  </p>
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center ${card.iconClass}`}>
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{card.note}</p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold text-slate-950">
                Invoice history
              </h3>
              <span className="border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                {invoices.length.toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Charges, payments, and remaining balances for this patient.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchInvoices()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 self-start border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-white text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-400">
              <tr>
                <th scope="col" className="px-5 py-3.5">Invoice</th>
                <th scope="col" className="px-4 py-3.5">Date issued</th>
                <th scope="col" className="px-4 py-3.5 text-right">Total</th>
                <th scope="col" className="px-4 py-3.5 text-right">Paid</th>
                <th scope="col" className="px-4 py-3.5 text-right">Balance</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const status = getStatus(invoice.status);
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={invoice.id}
                    className="transition-colors hover:bg-emerald-50/30"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-medium tabular-nums text-slate-700">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums text-emerald-800">
                      {formatCurrency(invoice.paidAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums text-slate-800">
                      {formatCurrency(invoice.balanceAmount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold ${status.className}`}>
                        <StatusIcon size={13} />
                        {status.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <Link
                        href={`/billing/${invoice.id}`}
                        aria-label={`View invoice ${invoice.invoiceNumber}`}
                        className="inline-flex h-8 items-center gap-1.5 border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10"
                      >
                        <Eye size={14} />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
