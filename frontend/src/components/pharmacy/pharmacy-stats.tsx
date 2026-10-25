
import { Package } from "lucide-react";

interface PharmacyStatsProps {
  totalMedicines: number;
  activeMedicines: number;
  totalVariants: number;
}

export default function PharmacyStats({
  totalMedicines,
  activeMedicines,
  totalVariants,
}: PharmacyStatsProps) {
  const stats = [
    {
      title: "Total Medicines",
      value: totalMedicines,
      icon: Package,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
    {
      title: "Active Medicines",
      value: activeMedicines,
      icon: Package,
      color: "text-green-600",
      background: "bg-green-50",
    },
    {
      title: "Medicine Variants",
      value: totalVariants,
      icon: Package,
      color: "text-emerald-600",
      background: "bg-emerald-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>

                <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>

              <div className={`rounded-xl p-3 ${stat.background} ${stat.color}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
