"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

import api from "@/lib/axios";

interface PatientDocument {
  id: string | number;
  fileName?: string;
  originalName?: string;
  filename?: string;
  mimeType?: string | null;
  fileSize?: number | null;
  size?: number | null;
  uploadedAt?: string;
  createdAt?: string;
}

interface DocumentsResponse {
  success: boolean;
  message: string;
  data: PatientDocument[];
}

interface DocumentUrlResponse {
  success: boolean;
  message: string;
  data: {
    url?: string;
    signedUrl?: string;
    downloadUrl?: string;
  };
}

interface PatientDocumentsProps {
  patientId: string;
}

export default function PatientDocuments({ patientId }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<DocumentsResponse>(
        `/patients/${patientId}/documents`
      );
      setDocuments(response.data.data ?? []);
    } catch (err) {
      console.error("Failed to fetch patient documents:", err);
      setError("Unable to load patient documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) void fetchDocuments();
  }, [patientId, fetchDocuments]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError("");
    setSuccess("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a document to upload.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("The selected file exceeds the 10 MB limit.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", selectedFile);
      await api.post(`/patients/${patientId}/documents`, formData);

      setSelectedFile(null);
      const fileInput = document.getElementById(
        `patient-document-${patientId}`
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";

      setSuccess("Document uploaded successfully.");
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to upload patient document:", err);
      setError("Document upload failed. Please check the file and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDocument = async (documentId: string | number) => {
    try {
      setOpeningDocumentId(String(documentId));
      setError("");
      const response = await api.get<DocumentUrlResponse>(
        `/patients/${patientId}/documents/${documentId}/url`
      );
      const documentUrl =
        response.data.data?.url ??
        response.data.data?.signedUrl ??
        response.data.data?.downloadUrl;

      if (!documentUrl) {
        setError("The document URL was not returned by the server.");
        return;
      }
      window.open(documentUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open patient document:", err);
      setError("Unable to open this document. Please try again.");
    } finally {
      setOpeningDocumentId(null);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (bytes == null || !Number.isFinite(bytes)) return "Size unavailable";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "Date unavailable";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";
    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDocumentName = (file: PatientDocument) =>
    file.originalName ?? file.fileName ?? file.filename ?? `Document ${file.id}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.02]">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <FileText size={19} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Patient documents</h2>
              {!loading && !error && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {documents.length}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Keep referrals, reports, and other files with this patient record.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void fetchDocuments()}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh files
        </button>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
            {success}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm shadow-slate-900/[0.04]">
                <Upload size={18} />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Add a document</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  PDF, PNG, JPG, JPEG, DOC or DOCX · up to 10 MB
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:min-w-[280px] sm:flex-row">
              <input
                id={`patient-document-${patientId}`}
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                className="sr-only"
              />
              <label
                htmlFor={`patient-document-${patientId}`}
                className={`inline-flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50/50 focus-within:ring-4 focus-within:ring-blue-600/10 ${uploading ? "pointer-events-none opacity-50" : ""}`}
              >
                <FileText size={15} className="shrink-0 text-slate-400" />
                <span className="truncate">{selectedFile?.name || "Choose a file"}</span>
              </label>
              <button
                type="button"
                onClick={() => void handleUpload()}
                disabled={!selectedFile || uploading}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-900/10 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="animate-spin" size={15} /> Uploading…</>
                ) : (
                  <><Upload size={15} /> Upload</>
                )}
              </button>
            </div>
          </div>
          {selectedFile && (
            <p className="mt-3 text-xs text-slate-500">
              Selected file size: <span className="font-semibold text-slate-700">{formatFileSize(selectedFile.size)}</span>
            </p>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Uploaded files</h3>
            {!loading && documents.length > 0 && (
              <span className="text-xs text-slate-400">{documents.length} {documents.length === 1 ? "file" : "files"}</span>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-9">
              <Loader2 className="animate-spin text-blue-700" size={20} />
              <span className="text-sm text-slate-500">Loading documents…</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                <FileText size={19} />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">No documents uploaded</p>
              <p className="mt-1 text-xs text-slate-500">Choose a file above to add the first document.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((file) => (
                <div key={file.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="break-all text-sm font-semibold text-slate-900">{getDocumentName(file)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatFileSize(file.fileSize ?? file.size)}
                        <span className="mx-1.5 text-slate-300">·</span>
                        Added {formatDate(file.uploadedAt ?? file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleOpenDocument(file.id)}
                    disabled={openingDocumentId === String(file.id)}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {openingDocumentId === String(file.id) ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Download size={14} />
                    )}
                    Open file
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
