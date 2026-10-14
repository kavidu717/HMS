"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
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

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const patientId = params.id;

  const [formData, setFormData] =
    useState<PatientFormData>(initialFormData);

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

      const response = await api.get<PatientResponse>(
        `/patients/${patientId}`
      );

      const patient = response.data.data;

      setPatientNumber(patient.patientNumber);
      setPatientStatus(patient.status);

      setFormData({
        firstName: patient.firstName ?? "",
        lastName: patient.lastName ?? "",
        dateOfBirth: patient.dateOfBirth
          ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: patient.gender ?? "",
        nic: patient.nic ?? "",
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        address: patient.address ?? "",
        emergencyContactName: patient.emergencyContactName ?? "",
        emergencyContactPhone: patient.emergencyContactPhone ?? "",
      });
    } catch (err: unknown) {
      console.error("Failed to fetch patient:", err);
      setError("Unable to load patient information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      void fetchPatient();
    }
  }, [patientId, fetchPatient]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
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
      setError(
        "Please fill in all required fields: first name, last name, date of birth, and gender."
      );
      return;
    }

    const dateOfBirth = new Date(formData.dateOfBirth);

    if (
      Number.isNaN(dateOfBirth.getTime()) ||
      dateOfBirth > new Date()
    ) {
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
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">
            Loading patient information...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !formData.firstName && !formData.lastName) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl p-6">
          <Link
            href="/patients"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>

          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => void fetchPatient()}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div>
          <Link
            href={`/patients/${patientId}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patient Details
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Patient
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Update the patient&apos;s personal and contact information.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs text-gray-500">Patient Number</p>
              <p className="font-semibold text-gray-900">
                {patientNumber || "N/A"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Status: {patientStatus || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
              <div className="rounded-lg bg-blue-50 p-2">
                <UserRound className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Personal Information
                </h2>
                <p className="text-sm text-gray-500">
                  Update the patient&apos;s basic details.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  First Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Date of Birth <span className="text-red-500">*</span>
                </label>

                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  required
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Gender <span className="text-red-500">*</span>
                </label>

                <select
                  id="gender"
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="nic"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  NIC
                </label>

                <input
                  id="nic"
                  name="nic"
                  type="text"
                  value={formData.nic}
                  onChange={handleChange}
                  placeholder="Enter NIC number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Contact Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the patient&apos;s contact details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Address
                </label>

                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter residential address"
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="font-semibold text-gray-900">
                Emergency Contact
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Update the emergency contact person&apos;s details.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="emergencyContactName"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Contact Person Name
                </label>

                <input
                  id="emergencyContactName"
                  name="emergencyContactName"
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Enter contact person's name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="emergencyContactPhone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Contact Person Phone
                </label>

                <input
                  id="emergencyContactPhone"
                  name="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Enter emergency contact number"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`/patients/${patientId}`}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}