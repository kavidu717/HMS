"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";

import api from "@/lib/axios";

interface MedicineVariant {
  id: string | number;
  strength: string;
  dosageForm: string;
  unit: string;
  reorderLevel: number;
  isActive: boolean;
}

interface Medicine {
  id: string | number;
  medicineName: string;
  brandName: string;
  medicineCode: string;
  variants?: MedicineVariant[];
}

interface StockBatch {
  id: string | number;
  batchNumber?: string;
  quantity: number;
  unitPrice?: number;
  sellingPrice?: number;
  expiryDate?: string | null;
}

interface StockData {
  variant?: {
    id: string | number;
    strength?: string;
    dosageForm?: string;
    unit?: string;
    reorderLevel?: number;
    medicine?: {
      medicineName?: string;
      brandName?: string;
    };
  };
  totalStock: number;
  lowStock: boolean;
  batches: StockBatch[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface StockManagementProps {
  medicines: Medicine[];
}

export default function StockManagement({
  medicines,
}: StockManagementProps) {
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [stockData, setStockData] = useState<StockData | null>(null);

  const [loading, setLoading] = useState(false);
  const [submittingBatchId, setSubmittingBatchId] = useState<string | null>(
    null,
  );

  const [movementType, setMovementType] = useState<
    "RECEIPT" | "ISSUE" | "ADJUSTMENT"
  >("RECEIPT");

  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const [selectedBatch, setSelectedBatch] = useState<StockBatch | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStock = async (variantId: string) => {
    if (!variantId) {
      setError("Please select a medicine variant.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setStockData(null);

      const response = await api.get<ApiResponse<StockData>>(
        `/pharmacy/variants/${variantId}/stock`,
      );

      setStockData(response.data.data);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setError(
        axiosError.response?.data?.message ||
          "Failed to load stock details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentForm = (batch: StockBatch) => {
    setSelectedBatch(batch);
    setMovementType("RECEIPT");
    setQuantity("");
    setReason("");
    setReferenceNumber("");
    setError("");
    setSuccess("");
  };

  const handleStockAdjustment = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedBatch) {
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }

    try {
      setSubmittingBatchId(String(selectedBatch.id));
      setError("");
      setSuccess("");

      const response = await api.patch<ApiResponse<unknown>>(
        `/pharmacy/batches/${selectedBatch.id}/stock`,
        {
          movementType,
          quantity: parsedQuantity,
          reason: reason.trim(),
          referenceNumber: referenceNumber.trim() || undefined,
        },
      );

      setSuccess(
        response.data.message || "Stock updated successfully.",
      );

      setSelectedBatch(null);
      setQuantity("");
      setReason("");
      setReferenceNumber("");

      await fetchStock(selectedVariantId);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setError(
        axiosError.response?.data?.message ||
          "Failed to update stock.",
      );
    } finally {
      setSubmittingBatchId(null);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString();
  };

  return (
    <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Package size={21} className="text-blue-600" />
            Stock Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View medicine stock, manage batches, and record stock movements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchStock(selectedVariantId)}
          disabled={!selectedVariantId || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh Stock
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedVariantId}
          onChange={(event) => {
            setSelectedVariantId(event.target.value);
            setStockData(null);
            setSelectedBatch(null);
            setError("");
            setSuccess("");
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select a medicine variant</option>

          {medicines.map((medicine) =>
            (medicine.variants ?? []).map((variant) => (
              <option key={variant.id} value={String(variant.id)}>
                {medicine.medicineName} ({medicine.brandName}) -{" "}
                {variant.strength} - {variant.dosageForm}
              </option>
            )),
          )}
        </select>

        <button
          type="button"
          onClick={() => void fetchStock(selectedVariantId)}
          disabled={!selectedVariantId || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Search size={17} />
          )}
          View Stock
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading stock details...
        </div>
      )}

      {stockData && !loading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Available Stock</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stockData.totalStock}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Batches</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stockData.batches.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Stock Status</p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  stockData.lowStock
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {stockData.lowStock ? "Low Stock" : "Stock Available"}
              </span>
            </div>
          </div>

          {stockData.batches.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-10 text-center">
              <Package className="mx-auto text-gray-400" size={32} />
              <p className="mt-3 font-medium text-gray-700">
                No stock batches found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                There are no batches available for this variant.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Unit Price</th>
                    <th className="px-4 py-3 font-semibold">Selling Price</th>
                    <th className="px-4 py-3 font-semibold">Expiry Date</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {stockData.batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 font-medium text-gray-800">
                        {batch.batchNumber || `Batch #${batch.id}`}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            batch.quantity <=
                            (stockData.variant?.reorderLevel ?? 0)
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {batch.quantity}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {batch.unitPrice ?? "—"}
                      </td>

                      <td className="px-4 py-4">
                        {batch.sellingPrice ?? "—"}
                      </td>

                      <td className="px-4 py-4">
                        {formatDate(batch.expiryDate)}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openAdjustmentForm(batch)}
                          className="whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          Manage Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedBatch && (
            <form
              onSubmit={handleStockAdjustment}
              className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-5"
            >
              <div>
                <h3 className="font-semibold text-gray-900">
                  Manage Batch{" "}
                  {selectedBatch.batchNumber || `#${selectedBatch.id}`}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Current quantity: {selectedBatch.quantity}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="movementType"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Movement Type
                  </label>

                  <select
                    id="movementType"
                    value={movementType}
                    onChange={(event) =>
                      setMovementType(
                        event.target.value as
                          | "RECEIPT"
                          | "ISSUE"
                          | "ADJUSTMENT",
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="RECEIPT">Stock Receipt (+)</option>
                    <option value="ISSUE">Stock Issue (-)</option>
                    <option value="ADJUSTMENT">Stock Adjustment</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stockQuantity"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Quantity
                  </label>

                  <input
                    id="stockQuantity"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="Enter quantity"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stockReason"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Reason
                  </label>

                  <input
                    id="stockReason"
                    type="text"
                    required
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Reason for stock movement"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="referenceNumber"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Reference Number (Optional)
                  </label>

                  <input
                    id="referenceNumber"
                    type="text"
                    value={referenceNumber}
                    onChange={(event) =>
                      setReferenceNumber(event.target.value)
                    }
                    placeholder="e.g. PO-002"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBatch(null)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submittingBatchId === String(selectedBatch.id)
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingBatchId === String(selectedBatch.id) && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Update Stock
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}