
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface AvailabilityData {
  doctorId: string;
  date: string;
  availableSlots: AvailableSlot[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface DoctorScheduleManagerProps {
  doctorId: string;
  doctorName: string;
  onClose: () => void;
}

interface ScheduleFormData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status: string;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const initialFormData: ScheduleFormData = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "17:00",
  status: "ACTIVE",
};

export default function DoctorScheduleManager({
  doctorId,
  doctorName,
  onClose,
}: DoctorScheduleManagerProps) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<DoctorSchedule | null>(null);
  const [formData, setFormData] =
    useState<ScheduleFormData>(initialFormData);

  const [availabilityDate, setAvailabilityDate] = useState(() => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  const [availability, setAvailability] =
    useState<AvailabilityData | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get<ApiResponse<DoctorSchedule[]>>(
        `/doctors/${doctorId}/schedules`
      );

      setSchedules(response.data.data ?? []);
    } catch (error) {
      console.error("Failed to fetch doctor schedules:", error);
      toast.error("Failed to load doctor schedules.");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    void fetchSchedules();
  }, [fetchSchedules]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingSchedule(null);
    setShowForm(false);
  };

  const handleOpenCreateForm = () => {
    setFormData(initialFormData);
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleOpenEditForm = (schedule: DoctorSchedule) => {
    setEditingSchedule(schedule);

    setFormData({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.slice(0, 5),
      endTime: schedule.endTime.slice(0, 5),
      status: schedule.status,
    });

    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (formData.startTime >= formData.endTime) {
      toast.error("End time must be later than start time.");
      return;
    }

    const payload = {
      dayOfWeek: Number(formData.dayOfWeek),
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
    };

    try {
      setSaving(true);

      if (editingSchedule) {
        await api.put(
          `/doctors/${doctorId}/schedules/${editingSchedule.id}`,
          payload
        );

        toast.success("Doctor schedule updated successfully.");
      } else {
        await api.post(`/doctors/${doctorId}/schedules`, payload);

        toast.success("Doctor schedule created successfully.");
      }

      resetForm();
      await fetchSchedules();
    } catch (error) {
      console.error("Failed to save doctor schedule:", error);
      toast.error("Failed to save schedule. Please check the entered details.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule: DoctorSchedule) => {
    const dayName =
      DAYS.find((day) => day.value === schedule.dayOfWeek)?.label ?? "Unknown";

    const confirmed = window.confirm(
      `Delete the ${dayName} schedule (${schedule.startTime.slice(
        0,
        5
      )} - ${schedule.endTime.slice(0, 5)})?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(schedule.id);

      await api.delete(
        `/doctors/${doctorId}/schedules/${schedule.id}`
      );

      toast.success("Doctor schedule deleted successfully.");

      if (editingSchedule?.id === schedule.id) {
        resetForm();
      }

      await fetchSchedules();
    } catch (error) {
      console.error("Failed to delete doctor schedule:", error);
      toast.error("Failed to delete schedule.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheckAvailability = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!availabilityDate) {
      toast.error("Please select a date.");
      return;
    }

    try {
      setLoadingAvailability(true);
      setAvailability(null);

      const response = await api.get<ApiResponse<AvailabilityData>>(
        `/doctors/${doctorId}/availability`,
        {
          params: {
            date: availabilityDate,
          },
        }
      );

      setAvailability(response.data.data);
    } catch (error) {
      console.error("Failed to check doctor availability:", error);
      toast.error("Failed to load availability for the selected date.");
    } finally {
      setLoadingAvailability(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS.find((day) => day.value === dayOfWeek)?.label ?? "Unknown";
  };

  const formatTime = (time: string) => {
    const [hoursString, minutes] = time.split(":");
    const hours = Number(hoursString);

    if (Number.isNaN(hours)) return time;

    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    return `${formattedHours}:${minutes} ${period}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden  border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center  bg-blue-50 text-blue-700 ring-1 ring-blue-100">
              <CalendarDays size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                Schedule Management
              </h2>

              <p className="truncate text-sm text-slate-500">
                {doctorName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close schedule management"
            className=" p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={21} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* Schedule List */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Weekly Schedules
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Manage this doctor&apos;s working hours.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void fetchSchedules()}
                  disabled={loading}
                  className="inline-flex items-center gap-2  border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="inline-flex items-center gap-2  bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
                >
                  <Plus size={17} />
                  Add Schedule
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
                <Loader2 size={22} className="animate-spin text-blue-600" />
                <span>Loading schedules...</span>
              </div>
            ) : schedules.length === 0 ? (
              <div className=" border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
                <CalendarDays
                  size={35}
                  className="mx-auto mb-3 text-blue-600"
                />

                <p className="font-semibold text-slate-900">
                  No schedules found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a weekly schedule for this doctor.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto  border border-slate-200">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Day</th>
                      <th className="px-4 py-3 font-medium">Start Time</th>
                      <th className="px-4 py-3 font-medium">End Time</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {schedules.map((schedule) => (
                      <tr
                        key={schedule.id}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {getDayName(schedule.dayOfWeek)}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {formatTime(schedule.startTime)}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {formatTime(schedule.endTime)}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex  px-2.5 py-1 text-xs font-medium ${
                              schedule.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                            }`}
                          >
                            {schedule.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditForm(schedule)}
                              title="Edit schedule"
                              className=" p-2 text-blue-600 transition hover:bg-blue-50"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(schedule)}
                              disabled={deletingId === schedule.id}
                              title="Delete schedule"
                              className=" p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              {deletingId === schedule.id ? (
                                <Loader2 size={17} className="animate-spin" />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Create / Edit Form */}
          {showForm && (
            <section className="mt-6  border border-blue-100 bg-blue-50/50 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900">
                  {editingSchedule ? "Edit Schedule" : "Create Schedule"}
                </h3>

                <button
                  type="button"
                  onClick={resetForm}
                  aria-label="Close schedule form"
                  className=" p-1.5 text-slate-400 transition hover:bg-blue-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="schedule-day"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Day of Week
                    </label>

                    <select
                      id="schedule-day"
                      value={formData.dayOfWeek}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          dayOfWeek: Number(event.target.value),
                        }))
                      }
                      required
                      className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="schedule-status"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Status
                    </label>

                    <select
                      id="schedule-status"
                      value={formData.status}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          status: event.target.value,
                        }))
                      }
                      required
                      className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="schedule-start"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Start Time
                    </label>

                    <input
                      id="schedule-start"
                      type="time"
                      value={formData.startTime}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          startTime: event.target.value,
                        }))
                      }
                      required
                      className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="schedule-end"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      End Time
                    </label>

                    <input
                      id="schedule-end"
                      type="time"
                      value={formData.endTime}
                      onChange={(event) =>
                        setFormData((previous) => ({
                          ...previous,
                          endTime: event.target.value,
                        }))
                      }
                      required
                      className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className=" border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2  bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && (
                      <Loader2 size={17} className="animate-spin" />
                    )}

                    {editingSchedule ? "Update Schedule" : "Create Schedule"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Availability */}
          <section className="mt-8 border-t border-slate-100 pt-6">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                <CalendarCheck size={19} className="text-blue-600" />
                Check Availability
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                View the available 30-minute appointment slots for a selected
                date.
              </p>
            </div>

            <form
              onSubmit={handleCheckAvailability}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="w-full sm:max-w-xs">
                <label
                  htmlFor="availability-date"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Select Date
                </label>

                <input
                  id="availability-date"
                  type="date"
                  value={availabilityDate}
                  onChange={(event) => {
                    setAvailabilityDate(event.target.value);
                    setAvailability(null);
                  }}
                  required
                  className="w-full  border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAvailability}
                className="inline-flex items-center justify-center gap-2  bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingAvailability ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Clock size={17} />
                )}

                Check Availability
              </button>
            </form>

            {availability && (
              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Available Slots
                  </h4>

                  <span className="text-sm text-slate-500">
                    {availability.date}
                  </span>
                </div>

                {availability.availableSlots.length === 0 ? (
                  <div className=" border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                    No time slots available for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {availability.availableSlots.map((slot, index) => (
                      <div
                        key={`${slot.startTime}-${slot.endTime}-${index}`}
                        className={`flex items-center justify-between gap-3  border p-3 ${
                          slot.available
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-slate-200 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock
                            size={17}
                            className={
                              slot.available
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }
                          />

                          <span className="text-sm font-medium text-slate-800">
                            {formatTime(slot.startTime)} –{" "}
                            {formatTime(slot.endTime)}
                          </span>
                        </div>

                        <span
                          className={`shrink-0  px-2 py-1 text-xs font-medium ${
                            slot.available
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {slot.available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className=" border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
