"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import api from "@/lib/axios";

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  invoiceDate: string;
  totalAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
  status: string;
  patient?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

interface InvoiceResponse {
  success: boolean;
  data: Invoice[];
}

const formatCurrency = (amount: string | number) =>
  `Rs. ${Number(amount).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getStatusStyle = (status: string) => {
  switch (status) {
    case "PAID":
      return {
        label: "Paid",
        style: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
        icon: CheckCircle2,
      };
    case "PARTIALLY_PAID":
      return {
        label: "Partially paid",
        style: "bg-amber-50 text-amber-700 ring-amber-200/70",
        icon: Clock3,
      };
    case "UNPAID":
      return {
        label: "Unpaid",
        style: "bg-rose-50 text-rose-700 ring-rose-200/70",
        icon: CircleAlert,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        style: "bg-slate-100 text-slate-600 ring-slate-200",
        icon: Ban,
      };
    default:
      return {
        label: status.replaceAll("_", " "),
        style: "bg-slate-100 text-slate-600 ring-slate-200",
        icon: CircleAlert,
      };
  }
};

const getPatientName = (invoice: Invoice) => {
  const name = invoice.patient
    ? `${invoice.patient.firstName ?? ""} ${invoice.patient.lastName ?? ""}`.trim()
    : "";

  return name || `Patient #${invoice.patientId}`;
};

export function InvoiceTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<InvoiceResponse>("/billing/invoices");

      setInvoices(response.data.data);
    } catch {
      setError("Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvoices();
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus =
      statusFilter === "ALL" || invoice.status === statusFilter;
    const matchesQuery =
      !normalizedQuery ||
      invoice.invoiceNumber.toLowerCase().includes(normalizedQuery) ||
      getPatientName(invoice).toLowerCase().includes(normalizedQuery) ||
      invoice.patientId.toLowerCase().includes(normalizedQuery);

    return matchesStatus && matchesQuery;
  });

  return (
    <section
      id="invoices"
      className="scroll-mt-24 overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]"
    >
      <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Invoice register
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Invoices
            </h2>
            <span className="bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {invoices.length.toLocaleString()} total
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            Review patient charges, payments and open balances.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchInvoices()}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50 lg:self-center"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh list
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6 md:flex-row md:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search invoices or patients</span>
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by invoice or patient"
            className="h-11 w-full border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          )}
        </label>

        <label className="relative flex min-w-48 items-center">
          <SlidersHorizontal
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 text-slate-400"
          />
          <span className="sr-only">Filter invoices by status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 w-full appearance-none border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
          >
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 h-1.5 w-1.5 rotate-45 border-b border-r border-slate-400"
          />
        </label>
      </div>

      {error && (
        <div className="mx-5 mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void fetchInvoices()}
            className="mt-1 font-semibold underline decoration-red-300 underline-offset-2 hover:decoration-red-700"
          >
            Try again
          </button>
        </div>
      )}

      {loading && invoices.length === 0 ? (
        <div className="space-y-4 p-6" aria-label="Loading invoices">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-4">
              <div className="h-10 w-10 bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-slate-100" />
                <div className="h-3 w-24 bg-slate-100" />
              </div>
              <div className="hidden h-3 w-24 bg-slate-100 sm:block" />
              <div className="h-8 w-20 bg-slate-100" />
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
            <FileText size={21} strokeWidth={1.8} />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            {error ? "Invoices could not be loaded" : "Your invoice register is ready"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
            {error
              ? "Try refreshing the invoice list in a moment."
              : "Invoices will appear here once they have been created."}
          </p>
        </div>
      ) : filteredInvoices.length === 0 && invoices.length > 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-500">
            <Search size={20} />
          </span>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No matching invoices
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
            Try another search or choose a different payment status.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("ALL");
            }}
            className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-white text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th scope="col" className="whitespace-nowrap px-6 py-3.5">
                  Invoice
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5">
                  Patient
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5">
                  Date issued
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5 text-right">
                  Total
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5 text-right">
                  Paid
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5 text-right">
                  Balance
                </th>
                <th scope="col" className="whitespace-nowrap px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((invoice) => {
                const patientName = getPatientName(invoice);
                const initials = patientName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0))
                  .join("")
                  .toUpperCase();
                const status = getStatusStyle(invoice.status);
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={invoice.id}
                    className="group transition-colors hover:bg-emerald-50/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-slate-800">
                        {invoice.invoiceNumber}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100 text-[11px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-100">
                          {initials || "P"}
                        </span>
                        <span className="font-medium text-slate-700">
                          {patientName}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(invoice.invoiceDate)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-slate-700">
                      {formatCurrency(invoice.totalAmount)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-500">
                      {formatCurrency(invoice.paidAmount)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-slate-800">
                      {formatCurrency(invoice.balanceAmount)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${status.style}`}
                      >
                        <StatusIcon size={13} strokeWidth={2} />
                        {status.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/billing/${invoice.id}`}
                        aria-label={`View invoice ${invoice.invoiceNumber}`}
                        className="inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/10"
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
      )}

      {!loading && invoices.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Showing <span className="font-semibold text-slate-700">{filteredInvoices.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{invoices.length}</span> invoices
          </p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 bg-emerald-500" />
            Amounts shown in Sri Lankan rupees
          </p>
        </div>
      )}
    </section>
  );
}
