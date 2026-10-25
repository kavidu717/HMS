"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Download,
  Package,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

interface MedicineVariant {
  id: string | number;
  medicineId?: string | number;
  strength: string;
  dosageForm: string;
  unit: string;
  reorderLevel: number;
  isActive: boolean;
}

interface Medicine {
  id: string | number;
  medicineCode: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  category: string;
  isActive: boolean;
  variants?: MedicineVariant[];
}

interface StockBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  purchasePrice: string | number;
  sellingPrice: string | number;
  expiryDate: string;
  receivedAt?: string;
}

interface VariantStock {
  medicineVariantId: string;
  medicineName: string;
  medicineCode: string;
  brandName: string;
  strength: string;
  dosageForm: string;
  unit: string;
  reorderLevel: number;
  totalStock: number;
  lowStock: boolean;
  batches: StockBatch[];
}

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

type ReportTab = "inventory" | "stock" | "low-stock" | "expiry";

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value: string | number) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = (filename: string, rows: unknown[][]) => {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
};

export default function PharmacyReportsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [stocks, setStocks] = useState<VariantStock[]>([]);
  const [expiryBatches, setExpiryBatches] = useState<ExpiryBatch[]>([]);

  const [activeTab, setActiveTab] = useState<ReportTab>("inventory");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(false);
  const [error, setError] = useState("");
  const [stockError, setStockError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [medicineResponse, expiryResponse] = await Promise.all([
        api.get<ApiResponse<Medicine[]>>("/pharmacy/medicines"),
        api.get<ApiResponse<ExpiryBatch[]>>("/pharmacy/expiry-monitoring"),
      ]);

      if (!medicineResponse.data.success) {
        throw new Error(
          medicineResponse.data.message || "Failed to load medicines.",
        );
      }

      if (!expiryResponse.data.success) {
        throw new Error(
          expiryResponse.data.message ||
            "Failed to load expiry monitoring data.",
        );
      }

      const medicineData = medicineResponse.data.data ?? [];
      setMedicines(medicineData);
      setExpiryBatches(expiryResponse.data.data ?? []);

      setStockLoading(true);
      setStockError("");

      const variants = medicineData.flatMap((medicine) =>
        (medicine.variants ?? []).map((variant) => ({
          medicine,
          variant,
        })),
      );

      const results = await Promise.allSettled(
        variants.map(({ variant }) =>
          api.get<ApiResponse<VariantStock>>(
            `/pharmacy/variants/${variant.id}/stock`,
          ),
        ),
      );

      const loadedStocks: VariantStock[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const payload = result.value.data;

          if (payload.success && payload.data) {
            loadedStocks.push(payload.data);
          }
        } else {
          console.error(
            `Failed to load stock for variant ${variants[index]?.variant.id}:`,
            result.reason,
          );
        }
      });

      setStocks(loadedStocks);

      if (loadedStocks.length < variants.length) {
        setStockError(
          `Stock data loaded for ${loadedStocks.length} of ${variants.length} variants. Some stock records could not be retrieved.`,
        );
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        axiosError.response?.data?.message ||
          axiosError.message ||
          "Failed to load pharmacy reports.",
      );
    } finally {
      setLoading(false);
      setStockLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredMedicines = useMemo(
    () =>
      medicines.filter((medicine) => {
        if (!normalizedSearch) return true;

        return [
          medicine.medicineCode,
          medicine.medicineName,
          medicine.brandName,
          medicine.genericName,
          medicine.category,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedSearch),
        );
      }),
    [medicines, normalizedSearch],
  );

  const filteredStocks = useMemo(
    () =>
      stocks.filter((stock) => {
        if (!normalizedSearch) return true;

        return [
          stock.medicineCode,
          stock.medicineName,
          stock.brandName,
          stock.strength,
          stock.dosageForm,
          ...stock.batches.map((batch) => batch.batchNumber),
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedSearch),
        );
      }),
    [stocks, normalizedSearch],
  );

  const lowStocks = useMemo(
    () => filteredStocks.filter((stock) => stock.lowStock),
    [filteredStocks],
  );

  const filteredExpiryBatches = useMemo(
    () =>
      expiryBatches.filter((batch) => {
        if (!normalizedSearch) return true;

        return [
          batch.medicineName,
          batch.medicineCode,
          batch.batchNumber,
          batch.strength,
          batch.dosageForm,
        ].some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedSearch),
        );
      }),
    [expiryBatches, normalizedSearch],
  );

  const expiredCount = expiryBatches.filter(
    (batch) => batch.status === "EXPIRED",
  ).length;

  const expiringSoonCount = expiryBatches.filter(
    (batch) => batch.status === "EXPIRING_SOON",
  ).length;

  const lowStockCount = stocks.filter((stock) => stock.lowStock).length;

  const totalStockUnits = stocks.reduce(
    (total, stock) => total + stock.totalStock,
    0,
  );

  const totalPurchaseValue = stocks.reduce(
    (total, stock) =>
      total +
      stock.batches.reduce(
        (batchTotal, batch) =>
          batchTotal + batch.quantity * Number(batch.purchasePrice),
        0,
      ),
    0,
  );

  const totalSellingValue = stocks.reduce(
    (total, stock) =>
      total +
      stock.batches.reduce(
        (batchTotal, batch) =>
          batchTotal + batch.quantity * Number(batch.sellingPrice),
        0,
      ),
    0,
  );

  const handleExport = () => {
    if (activeTab === "inventory") {
      downloadCsv("pharmacy-inventory-report.csv", [
        [
          "Medicine Code",
          "Medicine Name",
          "Brand",
          "Generic Name",
          "Category",
          "Status",
          "Variant Count",
        ],
        ...filteredMedicines.map((medicine) => [
          medicine.medicineCode,
          medicine.medicineName,
          medicine.brandName,
          medicine.genericName,
          medicine.category,
          medicine.isActive ? "Active" : "Inactive",
          medicine.variants?.length ?? 0,
        ]),
      ]);
      return;
    }

    if (activeTab === "stock") {
      downloadCsv("pharmacy-stock-report.csv", [
        [
          "Medicine Code",
          "Medicine Name",
          "Brand",
          "Strength",
          "Dosage Form",
          "Total Stock",
          "Reorder Level",
          "Batch Number",
          "Batch Quantity",
          "Purchase Price",
          "Selling Price",
          "Expiry Date",
        ],
        ...filteredStocks.flatMap((stock) =>
          stock.batches.map((batch) => [
            stock.medicineCode,
            stock.medicineName,
            stock.brandName,
            stock.strength,
            stock.dosageForm,
            stock.totalStock,
            stock.reorderLevel,
            batch.batchNumber,
            batch.quantity,
            batch.purchasePrice,
            batch.sellingPrice,
            batch.expiryDate,
          ]),
        ),
      ]);
      return;
    }

    if (activeTab === "low-stock") {
      downloadCsv("pharmacy-low-stock-report.csv", [
        [
          "Medicine Code",
          "Medicine Name",
          "Brand",
          "Strength",
          "Dosage Form",
          "Total Stock",
          "Reorder Level",
        ],
        ...lowStocks.map((stock) => [
          stock.medicineCode,
          stock.medicineName,
          stock.brandName,
          stock.strength,
          stock.dosageForm,
          stock.totalStock,
          stock.reorderLevel,
        ]),
      ]);
      return;
    }

    downloadCsv("pharmacy-expiry-report.csv", [
      [
        "Medicine Code",
        "Medicine Name",
        "Batch Number",
        "Strength",
        "Dosage Form",
        "Quantity",
        "Expiry Date",
        "Status",
      ],
      ...filteredExpiryBatches.map((batch) => [
        batch.medicineCode,
        batch.medicineName,
        batch.batchNumber,
        batch.strength,
        batch.dosageForm,
        batch.quantity,
        batch.expiryDate,
        batch.status,
      ]),
    ]);
  };

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "inventory", label: "Medicine Inventory" },
    { id: "stock", label: "Stock Report" },
    { id: "low-stock", label: "Low Stock" },
    { id: "expiry", label: "Expiry Report" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pharmacy Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review medicine inventory, stock levels, and expiry information.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download size={16} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => void fetchReports()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Medicines</span>
              <Package className="text-emerald-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">
              {loading ? "—" : medicines.length}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Low Stock Variants</span>
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {stockLoading ? "—" : lowStockCount}
            </p>
          </div>

          <div className="rounded-xl border border-red-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Expired Batches</span>
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold text-red-600">
              {loading ? "—" : expiredCount}
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Expiring Soon</span>
              <CalendarClock className="text-amber-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {loading ? "—" : expiringSoonCount}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Stock Units</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stockLoading ? "—" : totalStockUnits.toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Stock Purchase Value</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stockLoading ? "—" : formatMoney(totalPurchaseValue)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Based on current batch quantities and purchase prices.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Stock Selling Value</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {stockLoading ? "—" : formatMoney(totalSellingValue)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Estimated value if current stock is sold at listed selling prices.
            </p>
          </div>
        </div>

        {stockError && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>{stockError}</div>
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search report..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === "inventory" && (
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine Code</th>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-5 py-3 font-semibold">Brand</th>
                    <th className="px-5 py-3 font-semibold">Generic Name</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Variants</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                        Loading inventory report...
                      </td>
                    </tr>
                  ) : filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                        No medicines found.
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((medicine) => (
                      <tr key={medicine.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-800">
                          {medicine.medicineCode}
                        </td>
                        <td className="px-5 py-4 text-gray-900">
                          {medicine.medicineName}
                        </td>
                        <td className="px-5 py-4">{medicine.brandName}</td>
                        <td className="px-5 py-4">{medicine.genericName}</td>
                        <td className="px-5 py-4">{medicine.category}</td>
                        <td className="px-5 py-4">
                          {medicine.variants?.length ?? 0}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              medicine.isActive
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {medicine.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "stock" && (
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-5 py-3 font-semibold">Strength / Form</th>
                    <th className="px-5 py-3 font-semibold">Total Stock</th>
                    <th className="px-5 py-3 font-semibold">Reorder Level</th>
                    <th className="px-5 py-3 font-semibold">Batch</th>
                    <th className="px-5 py-3 font-semibold">Quantity</th>
                    <th className="px-5 py-3 font-semibold">Purchase Price</th>
                    <th className="px-5 py-3 font-semibold">Selling Price</th>
                    <th className="px-5 py-3 font-semibold">Expiry Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {stockLoading ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                        Loading stock report...
                      </td>
                    </tr>
                  ) : filteredStocks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                        No stock records found.
                      </td>
                    </tr>
                  ) : (
                    filteredStocks.flatMap((stock) =>
                      stock.batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">
                              {stock.medicineName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {stock.medicineCode}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {stock.strength} / {stock.dosageForm}
                          </td>
                          <td className="px-5 py-4">{stock.totalStock}</td>
                          <td className="px-5 py-4">{stock.reorderLevel}</td>
                          <td className="px-5 py-4">{batch.batchNumber}</td>
                          <td className="px-5 py-4">{batch.quantity}</td>
                          <td className="px-5 py-4">{formatMoney(batch.purchasePrice)}</td>
                          <td className="px-5 py-4">{formatMoney(batch.sellingPrice)}</td>
                          <td className="px-5 py-4">{formatDate(batch.expiryDate)}</td>
                        </tr>
                      )),
                    )
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "low-stock" && (
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-5 py-3 font-semibold">Code</th>
                    <th className="px-5 py-3 font-semibold">Strength / Form</th>
                    <th className="px-5 py-3 font-semibold">Current Stock</th>
                    <th className="px-5 py-3 font-semibold">Reorder Level</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {stockLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                        Loading low stock report...
                      </td>
                    </tr>
                  ) : lowStocks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                        No low-stock variants found.
                      </td>
                    </tr>
                  ) : (
                    lowStocks.map((stock) => (
                      <tr key={stock.medicineVariantId} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {stock.medicineName}
                        </td>
                        <td className="px-5 py-4">{stock.medicineCode}</td>
                        <td className="px-5 py-4">
                          {stock.strength} / {stock.dosageForm}
                        </td>
                        <td className="px-5 py-4 font-semibold text-amber-700">
                          {stock.totalStock}
                        </td>
                        <td className="px-5 py-4">{stock.reorderLevel}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Low Stock
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "expiry" && (
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Medicine</th>
                    <th className="px-5 py-3 font-semibold">Code</th>
                    <th className="px-5 py-3 font-semibold">Batch</th>
                    <th className="px-5 py-3 font-semibold">Strength / Form</th>
                    <th className="px-5 py-3 font-semibold">Quantity</th>
                    <th className="px-5 py-3 font-semibold">Expiry Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                        Loading expiry report...
                      </td>
                    </tr>
                  ) : filteredExpiryBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                        No expiry records found.
                      </td>
                    </tr>
                  ) : (
                    filteredExpiryBatches.map((batch) => (
                      <tr key={batch.batchId} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {batch.medicineName}
                        </td>
                        <td className="px-5 py-4">{batch.medicineCode}</td>
                        <td className="px-5 py-4">{batch.batchNumber}</td>
                        <td className="px-5 py-4">
                          {batch.strength} / {batch.dosageForm}
                        </td>
                        <td className="px-5 py-4">{batch.quantity}</td>
                        <td className="px-5 py-4">{formatDate(batch.expiryDate)}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              batch.status === "EXPIRED"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {batch.status === "EXPIRED"
                              ? "Expired"
                              : "Expiring Soon"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {activeTab === "inventory" &&
                `${filteredMedicines.length} medicine records`}
              {activeTab === "stock" &&
                `${filteredStocks.reduce(
                  (total, stock) => total + stock.batches.length,
                  0,
                )} batch records`}
              {activeTab === "low-stock" &&
                `${lowStocks.length} low-stock variants`}
              {activeTab === "expiry" &&
                `${filteredExpiryBatches.length} expiry records`}
            </span>
            <span>Data is based on the current pharmacy records.</span>
          </div>
        </section>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck size={15} />
          <span>
            Stock valuation is estimated using current batch quantities and
            recorded purchase or selling prices.
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
}