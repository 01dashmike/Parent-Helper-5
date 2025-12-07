"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle2, XCircle, Loader2, FileText, Shield, GraduationCap } from "lucide-react";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { VerificationFormSkeleton } from "./VerificationFormSkeleton";

interface VerificationFormProps {
  providerId: number;
}

interface VerificationStatus {
  id?: number;
  overall_status: string;
  id_document_url?: string;
  id_document_status?: string;
  insurance_document_url?: string;
  insurance_document_status?: string;
  qualifications_document_url?: string;
  qualifications_document_status?: string;
  rejection_reason?: string;
}

export default function VerificationForm({ providerId }: VerificationFormProps) {
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    fetchVerificationStatus();
  }, [providerId]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/provider/verification/status?provider_id=${providerId}`);
      if (response.ok) {
        const data = await response.json();
        setVerification(data.verification);
      }
    } catch (err) {
      console.error("Failed to fetch verification status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!file) return;

    // Validate file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Please upload JPEG (Joint Photographic Experts Group), PNG (Portable Network Graphics), WebP (Web Picture), or PDF (Portable Document Format).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setUploading(documentType);
    setError(null);
    setAnnouncement('Submitting…');

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider_id", providerId.toString());
      formData.append("document_type", documentType);

      const response = await fetch("/api/provider/verification/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setAnnouncement('Saved');
        await fetchVerificationStatus();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to upload document");
        setAnnouncement('Error saving changes');
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload document. Please try again.");
      setAnnouncement('Error saving changes');
    } finally {
      setUploading(null);
    }
  };

  const getStatusBadge = (status?: string, documentType?: string) => {
    const badgeId = documentType ? `status-badge-${documentType}` : "status-badge";
    if (!status || status === "pending") {
      return (
        <span 
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-small font-medium text-amber-700"
          aria-describedby={`${badgeId}-desc`}
        >
          Pending
          <VisuallyHidden id={`${badgeId}-desc`}>This document is awaiting review by our admin team</VisuallyHidden>
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span 
          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-small font-medium text-green-700"
          aria-describedby={`${badgeId}-desc`}
        >
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          Approved
          <VisuallyHidden id={`${badgeId}-desc`}>This document has been reviewed and approved by our admin team</VisuallyHidden>
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span 
          className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-small font-medium text-red-700"
          aria-describedby={`${badgeId}-desc`}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Rejected
          <VisuallyHidden id={`${badgeId}-desc`}>This document was rejected. Please check the rejection reason and upload a new document</VisuallyHidden>
        </span>
      );
    }
    return null;
  };

  const DocumentUploadSection = ({
    title,
    description,
    icon: Icon,
    documentType,
    documentUrl,
    documentStatus,
  }: {
    title: React.ReactNode;
    description: string;
    icon: React.ElementType;
    documentType: string;
    documentUrl?: string;
    documentStatus?: string;
  }) => {
    const isUploading = uploading === documentType;
    const isApproved = documentStatus === "approved";
    const isRejected = documentStatus === "rejected";

    return (
      <div className="rounded-xl border border-sage/20 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sage/10 p-2">
              <Icon className="h-5 w-5 text-sage" aria-hidden="true" />
            </div>
            <div>
              <h3 
                className="font-semibold text-charcoal"
                aria-describedby={documentType === "id" ? "id-doc-abbr-desc" : undefined}
              >
                {title}
              </h3>
              <p className="mt-1 text-small text-charcoal/70">{description}</p>
            </div>
          </div>
          {getStatusBadge(documentStatus, documentType)}
        </div>

        {documentUrl && (
          <div className="mb-4">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-small text-forest hover:underline"
              aria-label={`View uploaded ${title} document (opens in new tab)`}
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              View uploaded document
            </a>
          </div>
        )}

        {isRejected && verification?.rejection_reason && (
          <div role="alert">
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-small font-medium text-red-800">Rejection Reason:</p>
              <p id={`error-rejection-${documentType}`} className="mt-1 text-small text-red-600">{verification.rejection_reason}</p>
            </div>
          </div>
        )}

        {!isApproved && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sage/30 bg-white px-4 py-2 text-small font-medium text-forest transition hover:bg-sage/10 disabled:cursor-not-allowed disabled:opacity-50">
            {isUploading ? (
              <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4" aria-hidden="true" />
                <span>Uploading...</span>
                <VisuallyHidden>Uploading {documentType} document...</VisuallyHidden>
              </span>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden="true" />
                {documentUrl ? "Replace Document" : "Upload Document"}
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, documentType);
              }}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    );
  };

  if (loading) {
    return <VerificationFormSkeleton />;
  }

  const overallStatus = verification?.overall_status || "not_verified";

  return (
    <div className="space-y-6">
      <VisuallyHidden as="div" aria-live="assertive" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
      <div>
        <h2 className="text-title font-bold text-charcoal">Provider Verification</h2>
        <p className="mt-2 text-charcoal/70">
          Upload your verification documents to build trust with parents. All documents are securely stored and reviewed by our team.
        </p>
      </div>

      {error && (
        <p id="error-form" className="rounded-lg border border-red-200 bg-red-50 p-4 text-small text-red-600" role="alert">
          {error}
        </p>
      )}

      {overallStatus === "approved" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden="true" />
            <p className="font-medium text-green-800">Your verification has been approved!</p>
          </div>
          <p className="mt-1 text-small text-green-700">
            Your provider account is verified and parents can see your verified status.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <DocumentUploadSection
          title={
            <>
              ID Document
              <VisuallyHidden id="id-doc-abbr-desc"> (Identification Document)</VisuallyHidden>
            </>
          }
          description="Upload a government-issued ID (passport, driving license, etc.)"
          icon={Shield}
          documentType="id"
          documentUrl={verification?.id_document_url}
          documentStatus={verification?.id_document_status}
        />

        <DocumentUploadSection
          title="Insurance Certificate"
          description="Upload your public liability insurance certificate"
          icon={FileText}
          documentType="insurance"
          documentUrl={verification?.insurance_document_url}
          documentStatus={verification?.insurance_document_status}
        />

        <DocumentUploadSection
          title="Qualifications"
          description="Upload proof of your qualifications or certifications"
          icon={GraduationCap}
          documentType="qualifications"
          documentUrl={verification?.qualifications_document_url}
          documentStatus={verification?.qualifications_document_status}
        />
      </div>

      <div className="rounded-lg border border-sage/20 bg-cream/40 p-4">
        <p className="text-small text-charcoal/70">
          <strong>Note:</strong> All documents are reviewed by our admin team. You&apos;ll be notified once your verification is complete. 
          Documents are stored securely and only accessible to you and our admin team.
        </p>
      </div>
    </div>
  );
}

