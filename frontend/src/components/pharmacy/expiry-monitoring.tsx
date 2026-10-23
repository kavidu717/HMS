
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

interface ExpiryBatch {
  batchId: string;
  batchNumber: string;
  medicineName: string;
  medicineCode: string;
  strength: string;
  dosageForm: string;
  quantity: number;
  expiryDate: string;
  status: "EXPIRED" | "EXPIRING_SOON";
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type ExpiryFilter = "ALL" | "EXPIRED" | "EXPIRING_SOON";

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function ExpiryMonitoring() {
  const [batches, setBatches] = useState<ExpiryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ExpiryFilter>("ALL");

  const fetchExpiryBatches = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get<ApiResponse<ExpiryBatch[]>>(
        "/pharmacy/expiry-monitoring",
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to load expiry monitoring data",
        );
      }

      setBatches(response.data.data);
    } catch (error) {
      console.error("Failed to fetch expiry monitoring data:", error);
      toast.error("Failed to load expiry monitoring data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchExpiryBatches();
  }, [fetchExpiryBatches]);

  const expiredCount = useMemo(
    () => batches.filter((batch) => batch.status === "EXPIRED").length,
    [batches],
  );

  const expiringSoonCount = useMemo(
    () =>
      batches.filter((batch) => batch.status === "EXPIRING_SOON").length,
    [batches],
  );

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return batches.filter((batch) => {
      const matchesFilter = filter === "ALL" || batch.status === filter;

      const matchesSearch =
        !query ||
        batch.medicineName.toLowerCase().includes(query) ||
        batch.medicineCode.toLowerCase().includes(query) ||
        batch.batchNumber.toLowerCase().includes(query) ||
        batch.strength.toLowerCase().includes(query) ||
        batch.dosageForm.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [batches, filter, search]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Expiry Monitoring
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor expired medicines and batches expiring within 30 days.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchExpiryBatches()}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center bg-slate-100 text-slate-700">
              <Package size={20} />
            </div>
            <span className="text-xs font-medium text-slate-500">
              All matching batches
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-slate-900">
            {loading ? "—" : batches.length}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Batches requiring expiry monitoring
          </p>
        </div>

        <div className="border border-red-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <span className="text-xs font-medium text-red-600">
              Immediate attention
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-red-600">
            {loading ? "—" : expiredCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Expired medicine batches
          </p>
        </div>

        <div className="border border-amber-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center bg-amber-50 text-amber-600">
              <CalendarClock size={20} />
            </div>
            <span className="text-xs font-medium text-amber-600">
              Next 30 days
            </span>
          </div>

          <p className="mt-5 text-3xl font-semibold text-amber-600">
            {loading ? "—" : expiringSoonCount}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Batches expiring soon
          </p>
        </div>
      </div>

      <div className="border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">
              Medicine expiry records
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Search and filter batches by medicine, batch number, or status.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search medicines..."
                className="h-10 w-full border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 sm:w-64"
              />
            </div>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as ExpiryFilter)
              }
              className="h-10 border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              aria-label="Filter expiry status"
            >
              <option value="ALL">All statuses</option>
              <option value="EXPIRED">Expired</option>
              <option value="EXPIRING_SOON">Expiring soon</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Medicine</th>
                <th className="px-5 py-4 font-semibold">Batch number</th>
                <th className="px-5 py-4 font-semibold">Strength / Form</th>
                <th className="px-5 py-4 font-semibold">Quantity</th>
                <th className="px-5 py-4 font-semibold">Expiry date</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-14 text-center text-slate-500"
                  >
                    <RefreshCw
                      size={20}
                      className="mx-auto mb-3 animate-spin"
                    />
                    Loading expiry records...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <CheckCircle2
                      size={28}
                      className="mx-auto mb-3 text-emerald-500"
                    />
                    <p className="font-medium text-slate-700">
                      No matching batches found
                    </p>
                    <p className="mt-1 text-slate-500">
                      Try changing your search or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr
                    key={batch.batchId}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {batch.medicineName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {batch.medicineCode}
                      </p>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {batch.batchNumber}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      <p>{batch.strength}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {batch.dosageForm}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          batch.quantity <= 10
                            ? "font-semibold text-amber-600"
                            : "font-medium text-slate-700"
                        }
                      >
                        {batch.quantity}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        {formatDate(batch.expiryDate)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {batch.status === "EXPIRED" ? (
                        <span className="inline-flex items-center gap-1.5 border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <AlertTriangle size={13} />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <CalendarClock size={13} />
                          Expiring soon
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredBatches.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            Showing {filteredBatches.length} of {batches.length} batches
          </div>
        )}
      </div>
    </section>
  );
}
