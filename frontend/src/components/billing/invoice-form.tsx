"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

type InvoiceCategory =
  | "CONSULTATION"
  | "LABORATORY"
  | "PHARMACY"
  | "ADMISSION";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  status: string;
}

interface PatientResponse {
  success: boolean;
  data: Patient[];
}

interface InvoiceItemInput {
  category: InvoiceCategory;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    invoiceNumber: string;
  };
}

const categories: InvoiceCategory[] = [
  "CONSULTATION",
  "LABORATORY",
  "PHARMACY",
  "ADMISSION",
];

const categoryLabels: Record<InvoiceCategory, string> = {
  CONSULTATION: "Consultation",
  LABORATORY: "Laboratory",
  PHARMACY: "Pharmacy",
  ADMISSION: "Admission",
};

const inputClassName =
  "mt-2 h-11 w-full border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelClassName = "block text-sm font-medium text-slate-700";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
};

export function InvoiceForm() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<InvoiceItemInput[]>([
    {
      category: "CONSULTATION",
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientError, setPatientError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      setLoadingPatients(true);
      setPatientError("");

      const response = await api.get<PatientResponse>("/patients");
      setPatients(
        response.data.data.filter(
          (patient) => patient.status.toUpperCase() === "ACTIVE",
        ),
      );
    } catch (fetchError: unknown) {
      setPatientError(
        getErrorMessage(fetchError, "Could not load active patients."),
      );
    } finally {
      setLoadingPatients(false);
    }
  }, []);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const selectedPatient = patients.find((patient) => patient.id === patientId);
  const totalAmount = items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

  const formatCurrency = (amount: number) =>
    `Rs. ${amount.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const updateItem = (
    index: number,
    field: keyof InvoiceItemInput,
    value: string,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "quantity" || field === "unitPrice") {
          return {
            ...item,
            [field]: value === "" ? 0 : Number(value),
          };
        }

        return { ...item, [field]: value };
      }),
    );
    setError("");
  };

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        category: "CONSULTATION",
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!patientId) {
      setError("Select an active patient before creating the invoice.");
      return;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.description.trim() ||
        item.description.trim().length > 255 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0,
    );

    if (items.length === 0 || hasInvalidItem) {
      setError(
        "Add at least one charge with a description, whole-number quantity, and unit price greater than zero.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post<InvoiceResponse>(
        "/billing/invoices",
        {
          patientId,
          items: items.map((item) => ({
            category: item.category,
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create invoice.");
      }

      toast.success(`${response.data.data.invoiceNumber} created successfully.`);
      router.push("/billing");
      router.refresh();
    } catch (submitError: unknown) {
      const message = getErrorMessage(
        submitError,
        "Could not create the invoice. Check the details and try again.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]"
    >
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800"
          >
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
            <p>{error}</p>
          </div>
        )}

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <span className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-700">
              <UserRound size={19} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Patient details
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Select who this invoice is for.
              </p>
            </div>
            <span className="ml-auto text-xs font-medium text-slate-400">01</span>
          </div>

          <div className="p-5 sm:p-6">
            {patientError ? (
              <div className="flex flex-col gap-3 border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-rose-800">{patientError}</p>
                <button
                  type="button"
                  onClick={() => void fetchPatients()}
                  disabled={loadingPatients}
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-2 border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-800 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={loadingPatients ? "animate-spin" : ""}
                  />
                  Retry
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="patientId" className={labelClassName}>
                  Active patient <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <select
                    id="patientId"
                    value={patientId}
                    onChange={(event) => {
                      setPatientId(event.target.value);
                      setError("");
                    }}
                    disabled={loadingPatients || submitting || patients.length === 0}
                    required
                    className={`${inputClassName} appearance-none pr-10`}
                  >
                    <option value="">
                      {loadingPatients
                        ? "Loading active patients..."
                        : patients.length === 0
                          ? "No active patients available"
                          : "Choose a patient"}
                    </option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} · {patient.patientNumber}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Only active patient records can be billed.
                </p>

                {selectedPatient && (
                  <div className="mt-5 flex items-center gap-3 border border-emerald-100 bg-emerald-50/60 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-emerald-100 text-emerald-800">
                      {selectedPatient.firstName.charAt(0).toUpperCase()}
                      {selectedPatient.lastName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Patient ID · {selectedPatient.patientNumber}
                      </p>
                    </div>
                    <Check size={17} className="ml-auto shrink-0 text-emerald-700" />
                  </div>
                )}

                {!loadingPatients && !patientError && patients.length === 0 && (
                  <p className="mt-3 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                    An active patient record is required before an invoice can be created.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="overflow-hidden border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-teal-50 text-teal-800">
                <Receipt size={19} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-950">
                    Invoice items
                  </h2>
                  <span className="bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {items.length}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Add each charge as a separate line.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center gap-2 border border-emerald-200 bg-white px-3.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Add line item
            </button>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {items.map((item, index) => (
              <article
                key={index}
                className="border border-slate-200 bg-white transition-colors hover:border-slate-300"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center bg-emerald-100 text-xs font-bold text-emerald-800">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Charge {index + 1}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1 || submitting}
                    aria-label={`Remove charge ${index + 1}`}
                    className="inline-flex h-8 w-8 items-center justify-center text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="grid gap-x-4 gap-y-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[1fr_1.5fr_0.65fr_1fr]">
                  <div>
                    <label htmlFor={`category-${index}`} className={labelClassName}>
                      Category
                    </label>
                    <div className="relative">
                      <select
                        id={`category-${index}`}
                        value={item.category}
                        onChange={(event) =>
                          updateItem(index, "category", event.target.value)
                        }
                        disabled={submitting}
                        className={`${inputClassName} appearance-none pr-9`}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {categoryLabels[category]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`description-${index}`} className={labelClassName}>
                      Description <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={`description-${index}`}
                      type="text"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, "description", event.target.value)
                      }
                      placeholder="e.g. General consultation"
                      maxLength={255}
                      required
                      disabled={submitting}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor={`quantity-${index}`} className={labelClassName}>
                      Quantity <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity || ""}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      required
                      disabled={submitting}
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label htmlFor={`unitPrice-${index}`} className={labelClassName}>
                      Unit price <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                        Rs.
                      </span>
                      <input
                        id={`unitPrice-${index}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.unitPrice || ""}
                        onChange={(event) =>
                          updateItem(index, "unitPrice", event.target.value)
                        }
                        required
                        disabled={submitting}
                        className={`${inputClassName} pl-12`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-sm sm:px-5">
                  <span className="text-slate-500">Line total</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <section className="overflow-hidden border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]">
          <div className="bg-[#12392f] px-5 py-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
              Review before saving
            </p>
            <h2 className="mt-1.5 text-lg font-semibold">Invoice summary</h2>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Patient</span>
              <span className="max-w-40 truncate font-medium text-slate-800">
                {selectedPatient
                  ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                  : "Not selected"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Line items</span>
              <span className="font-medium tabular-nums text-slate-800">
                {items.length}
              </span>
            </div>

            <div className="space-y-2 border-y border-slate-100 py-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-start justify-between gap-3 text-xs">
                  <span className="min-w-0 text-slate-500">
                    <span className="block truncate text-slate-700">
                      {item.description.trim() || `Charge ${index + 1}`}
                    </span>
                    <span className="mt-0.5 block">
                      {item.quantity || 0} × {formatCurrency(item.unitPrice)}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-slate-700">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Invoice total</p>
                <p className="mt-1 text-[10px] text-slate-400">Sri Lankan rupees</p>
              </div>
              <p className="text-xl font-semibold tracking-tight tabular-nums text-slate-950">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || loadingPatients || patients.length === 0}
              className="inline-flex h-12 w-full items-center justify-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <FileText size={17} />
              )}
              {submitting ? "Creating invoice..." : "Create invoice"}
              {!submitting && <ArrowRight size={16} />}
            </button>

            <Link
              href="/billing"
              aria-disabled={submitting}
              className={`flex h-10 items-center justify-center border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 ${submitting ? "pointer-events-none opacity-50" : ""}`}
            >
              Cancel
            </Link>
          </div>
        </section>

        <div className="flex items-start gap-3 border border-emerald-100 bg-emerald-50/60 p-4">
          <Receipt size={16} className="mt-0.5 shrink-0 text-emerald-700" />
          <p className="text-xs leading-5 text-emerald-950/75">
            The invoice number is generated automatically after you save.
          </p>
        </div>
      </aside>
    </form>
  );
}
