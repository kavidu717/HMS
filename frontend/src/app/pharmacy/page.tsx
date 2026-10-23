"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";
import PharmacyStats from "@/components/pharmacy/pharmacy-stats";
import MedicineInventory from "@/components/pharmacy/medicine-inventory";
import StockManagement from "@/components/pharmacy/stock-management";

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
  description?: string | null;
  isActive: boolean;
  variants?: MedicineVariant[];
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface MedicineForm {
  medicineCode: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  category: string;
  description: string;
}

interface VariantForm {
  strength: string;
  dosageForm: string;
  unit: string;
  reorderLevel: string;
}

const initialMedicineForm: MedicineForm = {
  medicineCode: "",
  medicineName: "",
  brandName: "",
  genericName: "",
  category: "",
  description: "",
};

const initialVariantForm: VariantForm = {
  strength: "",
  dosageForm: "",
  unit: "",
  reorderLevel: "0",
};

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [variantSubmitting, setVariantSubmitting] = useState(false);

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);

  const [selectedMedicine, setSelectedMedicine] =
    useState<Medicine | null>(null);

  const [medicineForm, setMedicineForm] =
    useState<MedicineForm>(initialMedicineForm);

  const [variantForm, setVariantForm] =
    useState<VariantForm>(initialVariantForm);

  const [error, setError] = useState("");
  const [variantError, setVariantError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ApiResponse<Medicine[]>>("/pharmacy/medicines");

      setMedicines(response.data.data ?? []);
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
          "Failed to load medicines.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMedicines();
  }, [fetchMedicines]);

  const handleCreateMedicine = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        medicineCode: medicineForm.medicineCode.trim(),
        medicineName: medicineForm.medicineName.trim(),
        brandName: medicineForm.brandName.trim(),
        genericName: medicineForm.genericName.trim(),
        category: medicineForm.category.trim(),
        description: medicineForm.description.trim() || undefined,
      };

      const response = await api.post<ApiResponse<Medicine>>(
        "/pharmacy/medicines",
        payload,
      );

      setSuccess(
        response.data.message || "Medicine created successfully.",
      );

      setMedicineForm(initialMedicineForm);
      setShowForm(false);

      await fetchMedicines();
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
          "Failed to create medicine.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateVariant = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedMedicine) {
      return;
    }

    const reorderLevel = Number(variantForm.reorderLevel);

    if (
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      setVariantError(
        "Reorder level must be a non-negative whole number.",
      );
      return;
    }

    try {
      setVariantSubmitting(true);
      setVariantError("");
      setError("");
      setSuccess("");

      const payload = {
        strength: variantForm.strength.trim(),
        dosageForm: variantForm.dosageForm.trim(),
        unit: variantForm.unit.trim(),
        reorderLevel,
      };

      const response = await api.post<ApiResponse<MedicineVariant>>(
        `/pharmacy/medicines/${selectedMedicine.id}/variants`,
        payload,
      );

      setSuccess(
        response.data.message ||
          "Medicine variant created successfully.",
      );

      setVariantForm(initialVariantForm);
      setShowVariantForm(false);
      setSelectedMedicine(null);

      await fetchMedicines();
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setVariantError(
        axiosError.response?.data?.message ||
          "Failed to create medicine variant.",
      );
    } finally {
      setVariantSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const searchTerm = search.toLowerCase().trim();

    if (!searchTerm) {
      return true;
    }

    return (
      medicine.medicineCode.toLowerCase().includes(searchTerm) ||
      medicine.medicineName.toLowerCase().includes(searchTerm) ||
      medicine.brandName.toLowerCase().includes(searchTerm) ||
      medicine.genericName.toLowerCase().includes(searchTerm) ||
      medicine.category.toLowerCase().includes(searchTerm)
    );
  });

  const totalMedicines = medicines.length;

  const activeMedicines = medicines.filter(
    (medicine) => medicine.isActive,
  ).length;

  const totalVariants = medicines.reduce(
    (total, medicine) => total + (medicine.variants?.length ?? 0),
    0,
  );

  const openVariantForm = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setVariantForm(initialVariantForm);
    setVariantError("");
    setShowVariantForm(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pharmacy Management
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage medicine inventory and medicine variants.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void fetchMedicines()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setMedicineForm(initialMedicineForm);
                setError("");
                setShowForm(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Medicine
            </button>
          </div>
        </div>

        {success && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <Package size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{success}</p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <p className="flex-1">{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <PharmacyStats
         totalMedicines={totalMedicines}
         activeMedicines={activeMedicines}
         totalVariants={totalVariants}
      />

        <MedicineInventory
  medicines={filteredMedicines}
  totalMedicines={totalMedicines}
  search={search}
  loading={loading}
  onSearchChange={setSearch}
  onAddVariant={openVariantForm}
/>

   <StockManagement medicines={medicines} />

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
            <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add Medicine
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Enter the medicine details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  aria-label="Close medicine form"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateMedicine}>
                <div className="space-y-4 p-6">
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Medicine Code *
                    </label>

                    <input
                      required
                      maxLength={50}
                      value={medicineForm.medicineCode}
                      onChange={(event) =>
                        setMedicineForm({
                          ...medicineForm,
                          medicineCode: event.target.value,
                        })
                      }
                      placeholder="MED003"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Medicine Name *
                    </label>

                    <input
                      required
                      maxLength={150}
                      value={medicineForm.medicineName}
                      onChange={(event) =>
                        setMedicineForm({
                          ...medicineForm,
                          medicineName: event.target.value,
                        })
                      }
                      placeholder="Paracetamol"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Brand Name *
                      </label>

                      <input
                        required
                        maxLength={150}
                        value={medicineForm.brandName}
                        onChange={(event) =>
                          setMedicineForm({
                            ...medicineForm,
                            brandName: event.target.value,
                          })
                        }
                        placeholder="Panadol"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Generic Name *
                      </label>

                      <input
                        required
                        maxLength={150}
                        value={medicineForm.genericName}
                        onChange={(event) =>
                          setMedicineForm({
                            ...medicineForm,
                            genericName: event.target.value,
                          })
                        }
                        placeholder="Paracetamol"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Category *
                    </label>

                    <input
                      required
                      maxLength={100}
                      value={medicineForm.category}
                      onChange={(event) =>
                        setMedicineForm({
                          ...medicineForm,
                          category: event.target.value,
                        })
                      }
                      placeholder="Analgesic"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Description
                    </label>

                    <textarea
                      rows={3}
                      value={medicineForm.description}
                      onChange={(event) =>
                        setMedicineForm({
                          ...medicineForm,
                          description: event.target.value,
                        })
                      }
                      placeholder="Optional medicine description"
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={submitting}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}

                    {submitting ? "Saving..." : "Save Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showVariantForm && selectedMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
            <div className="my-auto w-full max-w-lg rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Add Medicine Variant
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedMedicine.medicineName} (
                    {selectedMedicine.medicineCode})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowVariantForm(false);
                    setSelectedMedicine(null);
                    setVariantError("");
                  }}
                  disabled={variantSubmitting}
                  aria-label="Close variant form"
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateVariant}>
                <div className="space-y-4 p-6">
                  {variantError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {variantError}
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Strength *
                    </label>

                    <input
                      required
                      maxLength={50}
                      value={variantForm.strength}
                      onChange={(event) =>
                        setVariantForm({
                          ...variantForm,
                          strength: event.target.value,
                        })
                      }
                      placeholder="500 mg"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Dosage Form *
                    </label>

                    <select
                      required
                      value={variantForm.dosageForm}
                      onChange={(event) =>
                        setVariantForm({
                          ...variantForm,
                          dosageForm: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select dosage form</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Drops">Drops</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Unit *
                    </label>

                    <input
                      required
                      maxLength={30}
                      value={variantForm.unit}
                      onChange={(event) =>
                        setVariantForm({
                          ...variantForm,
                          unit: event.target.value,
                        })
                      }
                      placeholder="tablet"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Reorder Level *
                    </label>

                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={variantForm.reorderLevel}
                      onChange={(event) =>
                        setVariantForm({
                          ...variantForm,
                          reorderLevel: event.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-1 text-xs text-gray-500">
                  
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVariantForm(false);
                      setSelectedMedicine(null);
                      setVariantError("");
                    }}
                    disabled={variantSubmitting}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={variantSubmitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {variantSubmitting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}

                    {variantSubmitting ? "Saving..." : "Save Variant"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}