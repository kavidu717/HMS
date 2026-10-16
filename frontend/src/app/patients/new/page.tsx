"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  Fingerprint,
  HeartPulse,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface CreatePatientResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    patientNumber: string;
  };
}

const initialFormData: PatientFormData = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  nic: "",
  email: "",
  phone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

const getLocalToday = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const inputClassName =
  "mt-2 h-11 w-full  border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelClassName = "block text-sm font-medium text-slate-700";

function RequiredMark() {
  return <span className="ml-1 text-rose-600" aria-hidden="true">*</span>;
}

export default function RegisterPatientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = getLocalToday();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.phone.trim()
    ) {
      setError(
        "Complete the required fields: first name, last name, date of birth, gender, and phone number."
      );
      return;
    }

    if (formData.dateOfBirth > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      nic: formData.nic.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim(),
      address: formData.address.trim() || undefined,
      emergencyContactName: formData.emergencyContactName.trim() || undefined,
      emergencyContactPhone: formData.emergencyContactPhone.trim() || undefined,
    };

    try {
      setLoading(true);

      const response = await api.post<CreatePatientResponse>(
        "/patients",
        payload
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to register patient.");
      }

      toast.success(response.data.message || "Patient registered successfully.");
      router.push("/patients");
      router.refresh();
    } catch (err: unknown) {
      console.error("Patient registration failed:", err);

      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || "Unable to register patient. Please try again."
        : err instanceof Error
          ? err.message
          : "An unexpected error occurred.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <Link
            href="/patients"
            className="mb-4 inline-flex items-center gap-2  py-1 text-sm font-medium text-slate-500 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
          >
            <ArrowLeft size={16} />
            Patient management
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                <span className="h-1.5 w-1.5  bg-blue-600" />
                Patients <span className="text-slate-300">/</span> Registration
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Register a patient
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Add the patient’s essential details to create a new record.
              </p>
            </div>
          </div>
        </header>

        <div className="flex items-start gap-3  border border-blue-100 bg-blue-50/70 px-4 py-3.5 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center  bg-white text-blue-700 shadow-sm shadow-blue-900/[0.04]">
            <Fingerprint size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-blue-950">
              Patient number is assigned automatically
            </p>
            <p className="mt-0.5 text-xs leading-5 text-blue-800/75">
              A unique patient number will be created when you save this record.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3  border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
              <p>{error}</p>
            </div>
          )}

          <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center  bg-blue-50 text-blue-700">
                  <UserRound size={19} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Personal information
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Patient identity and demographic details.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                <RequiredMark /> Required fields
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="firstName" className={labelClassName}>
                  First name <RequiredMark />
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  placeholder="Enter first name"
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="lastName" className={labelClassName}>
                  Last name <RequiredMark />
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  maxLength={50}
                  placeholder="Enter last name"
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className={labelClassName}>
                  Date of birth <RequiredMark />
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  max={today}
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="gender" className={labelClassName}>
                  Gender <RequiredMark />
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className={inputClassName}
                  disabled={loading}
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="nic" className={labelClassName}>
                  NIC number
                </label>
                <input
                  id="nic"
                  name="nic"
                  type="text"
                  autoComplete="off"
                  value={formData.nic}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="Enter NIC number"
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClassName}>
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-[calc(50%_+_0.25rem)] -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={150}
                    placeholder="patient@example.com"
                    className={`${inputClassName} pl-10`}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center  bg-cyan-50 text-cyan-800">
                <Phone size={18} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Contact information
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  A phone number is required to register this patient.
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="phone" className={labelClassName}>
                  Phone number <RequiredMark />
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  placeholder="Enter phone number"
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClassName}>
                  Address
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-5 text-slate-400"
                  />
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    maxLength={255}
                    placeholder="Enter patient’s address"
                    className={`${inputClassName} h-auto resize-y py-3 pl-10`}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center  bg-rose-50 text-rose-700">
                <HeartPulse size={19} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Emergency contact
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Optional contact details for emergencies.
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="emergencyContactName" className={labelClassName}>
                  Contact name
                </label>
                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Enter contact name"
                  className={inputClassName}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="emergencyContactPhone" className={labelClassName}>
                  Contact phone
                </label>
                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="Enter contact phone"
                  className={inputClassName}
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3  border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="px-1 text-xs text-slate-500">
              Fields marked <RequiredMark /> are needed to create the record.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Link
                href="/patients"
                className="inline-flex h-11 items-center justify-center  border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="inline-flex h-11 items-center justify-center gap-2  bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving patient…
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    Register patient
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
