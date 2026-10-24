"use client";

import { useState } from "react";
import axios from "axios";
import {
  Banknote,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER";

interface PaymentFormProps {
  invoiceId: string;
  balanceAmount: number;
  isCancelled?: boolean;
  onPaymentSuccess: () => void;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    payment: {
      id: string;
      paymentNumber: string;
    };
  };
}

const inputClassName =
  "h-11 w-full border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const methods: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof Banknote;
}[] = [
  {
    value: "CASH",
    label: "Cash",
    description: "In person",
    icon: Banknote,
  },
  {
    value: "CARD",
    label: "Card",
    description: "Debit or credit",
    icon: CreditCard,
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank transfer",
    description: "Electronic payment",
    icon: Landmark,
  },
];

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      "Could not record this payment. Please try again."
    );
  }

  return error instanceof Error
    ? error.message
    : "Could not record this payment. Please try again.";
};

export function PaymentForm({
  invoiceId,
  balanceAmount,
  isCancelled = false,
  onPaymentSuccess,
}: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Enter a payment amount greater than zero.");
      return;
    }

    if (paymentAmount > balanceAmount) {
      setError(
        `Payment cannot exceed the outstanding balance of ${formatCurrency(balanceAmount)}.`,
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post<PaymentResponse>("/billing/payments", {
        invoiceId,
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Payment could not be saved.");
      }

      toast.success("Payment recorded successfully.");
      setAmount("");
      setPaymentMethod("CASH");
      setReferenceNumber("");
      onPaymentSuccess();
    } catch (submitError: unknown) {
      const message = getErrorMessage(submitError);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="flex items-start gap-3 border border-slate-200 bg-slate-100 p-5 text-slate-700">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-slate-200 text-slate-600">
          <Receipt size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold">Invoice cancelled</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Payments can’t be recorded against a cancelled invoice.
          </p>
        </div>
      </div>
    );
  }

  if (balanceAmount <= 0) {
    return (
      <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-emerald-100 text-emerald-800">
          <Check size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold">Invoice paid in full</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800/80">
            There is no outstanding balance to collect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]"
    >
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
            <CreditCard size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Payment collection
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-950">
              Record a payment
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Add a payment to this invoice balance.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="border-l-2 border-amber-400 bg-amber-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">
            Outstanding balance
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <p className="text-xl font-semibold tracking-tight tabular-nums text-amber-950">
              {formatCurrency(balanceAmount)}
            </p>
            <button
              type="button"
              onClick={() => {
                setAmount(balanceAmount.toFixed(2));
                setError("");
              }}
              disabled={submitting}
              className="text-xs font-semibold text-amber-900 underline decoration-amber-400 underline-offset-2 transition hover:text-amber-950 disabled:opacity-50"
            >
              Use full balance
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="paymentAmount"
            className="block text-sm font-medium text-slate-700"
          >
            Payment amount <span className="text-rose-600">*</span>
          </label>
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
              Rs.
            </span>
            <input
              id="paymentAmount"
              type="number"
              min="0.01"
              max={balanceAmount}
              step="0.01"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              placeholder="0.00"
              required
              disabled={submitting}
              className={`${inputClassName} h-12 pl-12 text-base font-semibold tabular-nums`}
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Enter an amount up to {formatCurrency(balanceAmount)}.
          </p>
        </div>

        <fieldset disabled={submitting}>
          <legend className="text-sm font-medium text-slate-700">
            Payment method <span className="text-rose-600">*</span>
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {methods.map((method) => {
              const Icon = method.icon;
              const selected = paymentMethod === method.value;

              return (
                <label key={method.value} className="block cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={selected}
                    onChange={() => setPaymentMethod(method.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex min-h-[5.25rem] flex-col items-start justify-between border p-2.5 transition peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-600/10 ${
                      selected
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={17} className={selected ? "text-emerald-700" : "text-slate-400"} />
                    <span>
                      <span className="block text-xs font-semibold">{method.label}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">
                        {method.description}
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="referenceNumber"
            className="block text-sm font-medium text-slate-700"
          >
            Reference number <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="referenceNumber"
            type="text"
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
            placeholder="Transaction or receipt reference"
            maxLength={100}
            disabled={submitting}
            className={`${inputClassName} mt-2`}
          />
        </div>

        <div className="border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={submitting || balanceAmount <= 0}
            className="inline-flex h-11 w-full items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Receipt size={16} />
            )}
            {submitting ? "Recording payment..." : "Record payment"}
          </button>
          <p className="mt-2 text-center text-[11px] leading-5 text-slate-400">
            Payment details are added to this invoice’s history.
          </p>
        </div>
      </div>
    </form>
  );
}
