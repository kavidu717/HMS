"use client";

import { Plus, Search } from "lucide-react";

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
  medicineCode: string;
  medicineName: string;
  brandName: string;
  genericName: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  variants?: MedicineVariant[];
}

interface MedicineInventoryProps {
  medicines: Medicine[];
  totalMedicines: number;
  search: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onAddVariant: (medicine: Medicine) => void;
}

export default function MedicineInventory({
  medicines,
  totalMedicines,
  search,
  loading,
  onSearchChange,
  onAddVariant,
}: MedicineInventoryProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Medicine Inventory
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View medicines and manage their variants.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search medicines..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        </div>
      ) : medicines.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="font-medium text-gray-700">
            No medicines found
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Try another search term or add a new medicine.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-4 font-semibold">Medicine</th>
                <th className="px-5 py-4 font-semibold">Code</th>
                <th className="px-5 py-4 font-semibold">
                  Brand / Generic
                </th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Variants</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {medicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">
                      {medicine.medicineName}
                    </p>

                    {medicine.description && (
                      <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                        {medicine.description}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                      {medicine.medicineCode}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">
                      {medicine.brandName}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {medicine.genericName}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {medicine.category}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {medicine.variants && medicine.variants.length > 0 ? (
                      <div className="space-y-2">
                        {medicine.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2"
                          >
                            <p className="font-medium text-gray-800">
                              {variant.strength}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {variant.dosageForm} · {variant.unit}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Reorder level: {variant.reorderLevel}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No variants
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        medicine.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {medicine.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onAddVariant(medicine)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"
                    >
                      <Plus size={14} />
                      Add Variant
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-gray-200 px-5 py-4 text-xs text-gray-500">
        Showing {medicines.length} of {totalMedicines} medicines
      </div>
    </div>
  );
}