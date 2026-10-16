"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Fingerprint,
  HeartPulse,
  Loader2,
  Phone,
  RefreshCw,
  Save,
  UserRound,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import api from "@/lib/axios";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nic: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  status: string;
}

interface PatientResponse {
  success: boolean;
  message: string;
  data: Patient;
}

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

const inputClassName =
  "mt-2 h-11 w-full  border border-slate-200 bg-slate-50/60 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
const labelClassName = "block text-sm font-medium text-slate-700";
const sectionClassName =
  "overflow-hidden  border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]";

function RequiredMark() {
  return <span className="ml-1 text-rose-600" aria-hidden="true">*</span>;
}

function getDateInputValue(value: string) {
  if (!value) return "";
  // API dates are ISO strings; keep the calendar date instead of shifting it by timezone.
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function getLocalToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const patientId = params.id;

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [patientNumber, setPatientNumber] = useState("");
  const [patientStatus, setPatientStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<PatientResponse>(`/patients/${patientId}`);
      const patient = response.data.data;

      setPatientNumber(patient.patientNumber);
      setPatientStatus(patient.status);
      setFormData({
        firstName: patient.firstName ?? "",
        lastName: patient.lastName ?? "",
        dateOfBirth: getDateInputValue(patient.dateOfBirth),
        gender: patient.gender ?? "",
        nic: patient.nic ?? "",
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        address: patient.address ?? "",
        emergencyContactName: patient.emergencyContactName ?? "",
        emergencyContactPhone: patient.emergencyContactPhone ?? "",
      });
    } catch (err) {
      console.error("Failed to fetch patient:", err);
      setError("Unable to load patient information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) void fetchPatient();
  }, [patientId, fetchPatient]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.dateOfBirth ||
      !formData.gender
    ) {
      setError("Please fill in all required fields: first name, last name, date of birth, and gender.");
      return;
    }

    const dateOfBirth = new Date(formData.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > new Date()) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nic: formData.nic.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
      };

      await api.put(`/patients/${patientId}`, payload);
      setSuccess("Patient information updated successfully.");
      router.push(`/patients/${patientId}`);
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to update patient:", err);

      const errorMessage =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to update patient information. Please try again.";

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center  bg-blue-50 text-blue-700">
            <Loader2 className="animate-spin" size={22} />
          </span>
          <p className="text-sm text-slate-500">Loading patient information…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !formData.firstName && !formData.lastName) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl space-y-5">
          <Link href="/patients" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700">
            <ArrowLeft size={16} /> Patient management
          </Link>
          <div className=" border border-rose-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center  bg-rose-50 text-rose-600"><AlertCircle size={18} /></span>
              <div>
                <h1 className="font-semibold text-slate-900">Patient record unavailable</h1>
                <p className="mt-1 text-sm text-slate-500">{error}</p>
                <button type="button" onClick={() => void fetchPatient()} className="mt-4 inline-flex h-10 items-center gap-2  bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800">
                  <RefreshCw size={15} /> Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const today = getLocalToday();
  const active = patientStatus.toUpperCase() === "ACTIVE";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-5">
        <header>
          <Link
            href={`/patients/${patientId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10"
          >
            <ArrowLeft size={16} /> Patient record
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                <span className="h-1.5 w-1.5  bg-blue-600" />
                Patients <span className="text-slate-300">/</span> Edit record
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Edit patient</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Keep the patient profile accurate by updating their details below.
              </p>
            </div>
            <div className="flex w-fit items-center gap-3  border border-slate-200/80 bg-white px-4 py-3 shadow-sm shadow-slate-900/[0.02]">
              <span className="flex h-10 w-10 items-center justify-center  bg-blue-50 text-blue-700"><Fingerprint size={18} /></span>
              <div>
                <p className="font-mono text-sm font-semibold text-slate-900">{patientNumber || "—"}</p>
                <span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-medium ${active ? "text-emerald-700" : "text-slate-500"}`}>
                  <span className={`h-1.5 w-1.5  ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {patientStatus || "Status unavailable"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-3  border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800">
              <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div role="status" className=" border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">{success}</div>
          )}

          <section className={sectionClassName}>
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center  bg-blue-50 text-blue-700"><UserRound size={19} /></span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Personal information</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Identity and demographic details.</p>
                </div>
              </div>
              <p className="text-xs text-slate-500"><RequiredMark /> Required fields</p>
            </div>
            <div className="grid gap-x-5 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="firstName" className={labelClassName}>First name <RequiredMark /></label>
                <input id="firstName" name="firstName" type="text" autoComplete="given-name" required maxLength={50} value={formData.firstName} onChange={handleChange} placeholder="Enter first name" className={inputClassName} disabled={saving} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClassName}>Last name <RequiredMark /></label>
                <input id="lastName" name="lastName" type="text" autoComplete="family-name" required maxLength={50} value={formData.lastName} onChange={handleChange} placeholder="Enter last name" className={inputClassName} disabled={saving} />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className={labelClassName}>Date of birth <RequiredMark /></label>
                <input id="dateOfBirth" name="dateOfBirth" type="date" required max={today} value={formData.dateOfBirth} onChange={handleChange} className={inputClassName} disabled={saving} />
              </div>
              <div>
                <label htmlFor="gender" className={labelClassName}>Gender <RequiredMark /></label>
                <select id="gender" name="gender" required value={formData.gender} onChange={handleChange} className={inputClassName} disabled={saving}>
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="nic" className={labelClassName}>NIC number</label>
                <input id="nic" name="nic" type="text" autoComplete="off" maxLength={20} value={formData.nic} onChange={handleChange} placeholder="Enter NIC number" className={inputClassName} disabled={saving} />
              </div>
              <div>
                <label htmlFor="email" className={labelClassName}>Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" maxLength={150} value={formData.email} onChange={handleChange} placeholder="patient@example.com" className={inputClassName} disabled={saving} />
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center  bg-cyan-50 text-cyan-800"><Phone size={18} /></span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Contact information</h2>
                <p className="mt-0.5 text-xs text-slate-500">Phone, email, and residential address.</p>
              </div>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="phone" className={labelClassName}>Phone number</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20} value={formData.phone} onChange={handleChange} placeholder="Enter phone number" className={inputClassName} disabled={saving} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className={labelClassName}>Address</label>
                <textarea id="address" name="address" rows={3} maxLength={255} value={formData.address} onChange={handleChange} placeholder="Enter patient’s address" className={`${inputClassName} h-auto resize-y py-3`} disabled={saving} />
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <span className="flex h-10 w-10 items-center justify-center  bg-rose-50 text-rose-700"><HeartPulse size={19} /></span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Emergency contact</h2>
                <p className="mt-0.5 text-xs text-slate-500">A person to contact if urgent care is needed.</p>
              </div>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <label htmlFor="emergencyContactName" className={labelClassName}>Contact person</label>
                <input id="emergencyContactName" name="emergencyContactName" type="text" maxLength={150} value={formData.emergencyContactName} onChange={handleChange} placeholder="Enter contact person’s name" className={inputClassName} disabled={saving} />
              </div>
              <div>
                <label htmlFor="emergencyContactPhone" className={labelClassName}>Contact phone</label>
                <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" maxLength={20} value={formData.emergencyContactPhone} onChange={handleChange} placeholder="Enter emergency contact number" className={inputClassName} disabled={saving} />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3  border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs leading-5 text-slate-500">Review the updated information before saving this patient record.</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Link href={`/patients/${patientId}`} className="inline-flex h-11 items-center justify-center  border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10">
                Cancel
              </Link>
              <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2  bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? <><Loader2 className="animate-spin" size={16} /> Saving changes…</> : <><Save size={16} /> Save changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
