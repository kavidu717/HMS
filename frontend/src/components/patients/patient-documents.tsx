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

interface UploadResponse {
  success: boolean;
  message: string;
  data: PatientDocument;
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

export default function PatientDocuments({
  patientId,
}: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null
  );

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
    if (patientId) {
      void fetchDocuments();
    }
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

    const maxFileSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxFileSize) {
      setError("The selected file exceeds the 10 MB limit.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      await api.post(
        `/patients/${patientId}/documents`,
        formData
      );

      setSelectedFile(null);

      const fileInput = document.getElementById(
        `patient-document-${patientId}`
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setSuccess("Document uploaded successfully.");

      await fetchDocuments();
    } catch (err) {
      console.error("Failed to upload patient document:", err);
      setError(
        "Document upload failed. Please check the file and try again."
      );
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
    if (bytes == null || !Number.isFinite(bytes)) {
      return "Size unavailable";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDocumentName = (document: PatientDocument) =>
    document.originalName ??
    document.fileName ??
    document.filename ??
    `Document ${document.id}`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Patient Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload and view documents associated with this patient.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchDocuments()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="space-y-5 p-5">
        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Upload Form */}
        <div className="rounded-lg border border-dashed border-gray-300 p-4 sm:p-5">
          <label
            htmlFor={`patient-document-${patientId}`}
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Select a document
          </label>

          <input
            id={`patient-document-${patientId}`}
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="block w-full cursor-pointer rounded-lg border border-gray-300 text-sm text-gray-700 file:mr-4 file:border-0 file:bg-gray-100 file:px-4 file:py-2.5 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:opacity-50"
          />

          <p className="mt-2 text-xs text-gray-500">
            Accepted formats: PDF, PNG, JPG, JPEG, DOC and DOCX.
            Maximum file size: 10 MB.
          </p>

          {selectedFile && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <p className="break-all text-sm font-medium text-gray-800">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!selectedFile || uploading}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </button>
        </div>

        {/* Documents List */}
        <div>
          <h3 className="mb-3 font-semibold text-gray-900">
            Uploaded Documents
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-gray-500">
                Loading documents...
              </span>
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
              <FileText className="mx-auto h-9 w-9 text-gray-300" />

              <p className="mt-3 font-medium text-gray-800">
                No documents uploaded
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Select a file above to upload the first document.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="break-all text-sm font-medium text-gray-900">
                        {getDocumentName(document)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatFileSize(
                          document.fileSize ?? document.size
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Uploaded:{" "}
                        {formatDate(
                          document.uploadedAt ?? document.createdAt
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleOpenDocument(document.id)}
                    disabled={openingDocumentId === String(document.id)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {openingDocumentId === String(document.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}

                    Open Document
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