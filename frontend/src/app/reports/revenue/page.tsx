"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/dashboard-layout";

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

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getPatientName = (invoice: Invoice) => {
  const name = invoice.patient
    ? `${invoice.patient.firstName ?? ""} ${invoice.patient.lastName ?? ""}`.trim()
    : "";

  return name || `Patient #${invoice.patientId}`;
};

const escapeCsv = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

export default function RevenueReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<InvoiceResponse>("/billing/invoices");
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid invoice response");
      }

      setInvoices(data);
    } catch {
      setError("Failed to load revenue data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesQuery =
        !normalizedQuery ||
        invoice.invoiceNumber.toLowerCase().includes(normalizedQuery) ||
        getPatientName(invoice).toLowerCase().includes(normalizedQuery) ||
        invoice.patientId.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "ALL" || invoice.status === statusFilter;

      const invoiceDate = new Date(invoice.invoiceDate);
      const matchesFromDate =
        !fromDate ||
        invoiceDate >= new Date(`${fromDate}T00:00:00`);

      const matchesToDate =
        !toDate ||
        invoiceDate < new Date(
          new Date(`${toDate}T00:00:00`).getTime() + 24 * 60 * 60 * 1000,
        );

      return (
        matchesQuery &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [invoices, query, statusFilter, fromDate, toDate]);

  const summary = useMemo(() => {
    return filteredInvoices.reduce(
      (totals, invoice) => {
        totals.totalBilled += Number(invoice.totalAmount) || 0;
        totals.totalPaid += Number(invoice.paidAmount) || 0;
        totals.outstandingBalance += Number(invoice.balanceAmount) || 0;

        return totals;
      },
      {
        totalBilled: 0,
        totalPaid: 0,
        outstandingBalance: 0,
      },
    );
  }, [filteredInvoices]);

  const exportCsv = () => {
    const headers = [
      "Invoice Number",
      "Patient",
      "Invoice Date",
      "Total Amount",
      "Paid Amount",
      "Outstanding Balance",
      "Status",
    ];

    const rows = filteredInvoices.map((invoice) => [
      invoice.invoiceNumber,
      getPatientName(invoice),
      formatDate(invoice.invoiceDate),
      Number(invoice.totalAmount) || 0,
      Number(invoice.paidAmount) || 0,
      Number(invoice.balanceAmount) || 0,
      invoice.status,
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  const summaryCards = [
    {
      title: "Total Invoices",
      value: filteredInvoices.length.toLocaleString(),
      description: "Invoices matching selected filters",
      icon: FileText,
      iconStyle: "bg-sky-50 text-sky-700 ring-sky-100",
    },
    {
      title: "Total Billed",
      value: formatCurrency(summary.totalBilled),
      description: "Total invoiced amount",
      icon: Wallet,
      iconStyle: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    {
      title: "Total Paid",
      value: formatCurrency(summary.totalPaid),
      description: "Payments recorded against invoices",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      title: "Outstanding Balance",
      value: formatCurrency(summary.outstandingBalance),
      description: "Remaining balance on invoices",
      icon: CircleAlert,
      iconStyle: "bg-amber-50 text-amber-700 ring-amber-100",
    },
  ];

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/reports"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700"
            >
              <ArrowLeft size={16} />
              Back to Reports
            </Link>

            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <span className="h-1.5 w-1.5 bg-emerald-600" />
              Reports / Revenue
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Revenue Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review invoice totals, recorded payments and outstanding
              balances for a selected period.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || filteredInvoices.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || filteredInvoices.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="relative overflow-hidden bg-[#12392f] p-6 text-white shadow-lg sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                Financial overview
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                Revenue at a glance
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/75">
                Use the filters below to review financial activity based on
                invoice dates and payment status.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-white/10 bg-white/[0.07] p-4">
              <span className="flex h-11 w-11 items-center justify-center bg-white/10 text-emerald-100">
                <CalendarDays size={21} />
              </span>
              <div>
                <p className="text-xs text-emerald-100/70">Invoices shown</p>
                <p className="mt-1 text-xl font-semibold">
                  {loading ? "—" : filteredInvoices.length.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex flex-col gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void fetchInvoices()}
              className="inline-flex items-center gap-2 self-start font-semibold hover:text-red-900"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className="min-w-0 border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-emerald-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {card.title}
                  </p>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center ring-1 ring-inset ${card.iconStyle}`}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                </div>

                <p
                  className="mt-4 break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl"
                  title={card.value}
                >
                  {loading ? "Loading..." : card.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {card.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Report Filters
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter invoice records by search term, invoice date and status.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:p-6">
            <label className="sm:col-span-2 lg:col-span-1">
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Search
              </span>
              <span className="relative block">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Invoice or patient"
                  className="h-11 w-full border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
                />
              </span>
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                From date
              </span>
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                To date
              </span>
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-semibold text-slate-600">
                Invoice status
              </span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-600/10"
              >
                <option value="ALL">All statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIALLY_PAID">Partially paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 w-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Revenue Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Invoice-level billing and payment summary.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void fetchInvoices()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 self-start border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:self-center"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {loading && invoices.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading revenue report...
            </div>
          ) : error && invoices.length === 0 ? (
            <div className="p-10 text-center">
              <CircleAlert className="mx-auto text-red-500" size={25} />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Revenue data is unavailable.
              </p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-10 text-center">
              <Clock3 className="mx-auto text-slate-400" size={25} />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                No matching invoices
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Change your filters or clear them to see more records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="whitespace-nowrap px-5 py-3.5">
                      Invoice
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5">
                      Patient
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5">
                      Invoice Date
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">
                      Billed
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">
                      Paid
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5 text-right">
                      Balance
                    </th>
                    <th className="whitespace-nowrap px-5 py-3.5">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-emerald-50/30"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <Link
                          href={`/billing/${invoice.id}`}
                          className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                        {getPatientName(invoice)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(invoice.invoiceDate)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-700">
                        {formatCurrency(Number(invoice.totalAmount) || 0)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-emerald-700">
                        {formatCurrency(Number(invoice.paidAmount) || 0)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-700">
                        {formatCurrency(Number(invoice.balanceAmount) || 0)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            invoice.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : invoice.status === "PARTIALLY_PAID"
                                ? "bg-amber-50 text-amber-700 ring-amber-200"
                                : invoice.status === "UNPAID"
                                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                                  : "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {invoice.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
                  <tr>
                    <th
                      colSpan={3}
                      className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                    >
                      Filtered totals
                    </th>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold tabular-nums text-slate-900">
                      {formatCurrency(summary.totalBilled)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold tabular-nums text-emerald-700">
                      {formatCurrency(summary.totalPaid)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold tabular-nums text-slate-900">
                      {formatCurrency(summary.outstandingBalance)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {!loading && !error && invoices.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredInvoices.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {invoices.length}
                </span>{" "}
                invoices
              </p>
              <p>All amounts are displayed in Sri Lankan rupees.</p>
            </div>
          )}
        </section>
      </main>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          aside,
          nav,
          header a,
          header button,
          section button,
          section input,
          section select {
            display: none !important;
          }

          main {
            max-width: none !important;
            padding: 0 !important;
          }

          main section {
            break-inside: avoid;
            box-shadow: none !important;
          }

          main table {
            min-width: 0 !important;
            font-size: 10px !important;
          }

          main th,
          main td {
            padding: 6px !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}