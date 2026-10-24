"use client";

import { useEffect, useState } from "react";
import { CreditCard, FileText, Receipt, Wallet } from "lucide-react";
import api from "@/lib/axios";

interface Invoice {
  id: string;
  totalAmount: string | number;
  paidAmount: string | number;
  balanceAmount: string | number;
}

interface InvoiceResponse {
  success: boolean;
  data: Invoice[];
}

export function BillingStats() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<InvoiceResponse>("/billing/invoices");

        setInvoices(response.data.data);
      } catch {
        setError("Failed to load billing statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const totalBilled = invoices.reduce(
    (total, invoice) => total + Number(invoice.totalAmount),
    0,
  );
  const totalPaid = invoices.reduce(
    (total, invoice) => total + Number(invoice.paidAmount),
    0,
  );
  const outstandingBalance = invoices.reduce(
    (total, invoice) => total + Number(invoice.balanceAmount),
    0,
  );

  const formatCurrency = (amount: number) =>
    `Rs. ${amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const stats = [
    {
      title: "Total invoices",
      value: invoices.length.toLocaleString(),
      description: "Generated patient invoices",
      icon: FileText,
      iconStyle: "bg-sky-50 text-sky-700 ring-sky-100",
    },
    {
      title: "Total billed",
      value: formatCurrency(totalBilled),
      description: "Total amount invoiced",
      icon: Receipt,
      iconStyle: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    {
      title: "Total paid",
      value: formatCurrency(totalPaid),
      description: "Payments received to date",
      icon: CreditCard,
      iconStyle: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    {
      title: "Outstanding balance",
      value: formatCurrency(outstandingBalance),
      description: "Awaiting payment",
      icon: Wallet,
      iconStyle: "bg-amber-50 text-amber-700 ring-amber-100",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-100" />
              <div className="h-10 w-10 bg-slate-100" />
            </div>
            <div className="mt-5 h-8 w-36 bg-slate-100" />
            <div className="mt-3 h-3 w-40 bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
        <p className="font-semibold">Billing summary unavailable</p>
        <p className="mt-1 text-red-700/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="group border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-sm font-medium text-slate-500">
                {stat.title}
              </p>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center ring-1 ring-inset ${stat.iconStyle}`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
            </div>

            <div
              className="mt-4 truncate text-[1.35rem] font-semibold tracking-tight text-slate-950 sm:text-2xl"
              title={stat.value}
            >
              {stat.value}
            </div>

            <p className="mt-2 text-xs text-slate-500">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
