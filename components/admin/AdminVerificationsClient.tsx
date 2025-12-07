"use client";

import { useState, useEffect, useTransition, useId } from "react";
import { CheckCircle2, XCircle, Eye, Loader2, FileText, Shield, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { formatDateDefault } from "@/lib/utils/date";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface Provider {
  id: number;
  name: string;
  slug: string;
  contact_email?: string;
  town?: string;
}

interface Verification {
  id: number;
  provider_id: number;
  user_id: string;
  id_document_url?: string;
  id_document_status?: string;
  insurance_document_url?: string;
  insurance_document_status?: string;
  qualifications_document_url?: string;
  qualifications_document_status?: string;
  overall_status: string;
  rejection_reason?: string;
  submitted_at: string;
  providers?: Provider;
}

interface AdminVerificationsClientProps {
  initialVerifications: Verification[];
}

export default function AdminVerificationsClient({
  initialVerifications,
}: AdminVerificationsClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const rejectionReasonId = useId();
  const verificationNotesId = useId();
  const [verifications] = useState<Verification[]>(initialVerifications);
  const [, startTransition] = useTransition();
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formattedDates, setFormattedDates] = useState<Record<number, string>>({});

  // Format dates on client side to avoid hydration mismatches
  useEffect(() => {
    const formatted: Record<number, string> = {};
    verifications.forEach((verification) => {
      if (verification.submitted_at) {
        formatted[verification.id] = formatDateDefault(verification.submitted_at);
      }
    });
    setFormattedDates(formatted);
  }, [verifications]);

  const handleApprove = async (verificationId: number, documentType?: string) => {
    setReviewingId(verificationId);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/verifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verification_id: verificationId,
            action: "approve",
            document_type: documentType,
            notes: notes || undefined,
          }),
        });

        if (response.ok) {
          router.refresh();
          toast({
            title: "Approved",
            description: "Verification approved successfully",
            variant: "success",
          });
        } else {
          const error = await response.json();
          console.error("Failed to approve:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to approve verification",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error approving verification:", err);
        toast({
          title: "Error",
          description: "Failed to approve verification",
          variant: "destructive",
        });
      } finally {
        setReviewingId(null);
        setRejectionReason("");
        setNotes("");
      }
    });
  };

  const handleReject = async (verificationId: number, documentType?: string) => {
    if (!rejectionReason.trim() && !documentType) {
      toast({
        title: "Required Field",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setReviewingId(verificationId);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/verifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verification_id: verificationId,
            action: "reject",
            document_type: documentType,
            reason: rejectionReason,
            notes: notes || undefined,
          }),
        });

        if (response.ok) {
          router.refresh();
          toast({
            title: "Rejected",
            description: "Verification rejected",
            variant: "default",
          });
        } else {
          const error = await response.json();
          console.error("Failed to reject:", error);
          toast({
            title: "Error",
            description: error.error || "Failed to reject verification",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Error rejecting verification:", err);
        toast({
          title: "Error",
          description: "Failed to reject verification",
          variant: "destructive",
        });
      } finally {
        setReviewingId(null);
        setRejectionReason("");
        setNotes("");
      }
    });
  };

  const getStatusBadge = (status?: string, documentType?: string) => {
    const badgeId = documentType ? `admin-status-badge-${documentType}` : "admin-status-badge";
    if (!status || status === "pending") {
      return (
        <span 
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-small font-medium text-amber-700"
          aria-describedby={`${badgeId}-desc`}
        >
          Pending
          <VisuallyHidden id={`${badgeId}-desc`}>This document is awaiting admin review</VisuallyHidden>
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span 
          className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-small font-medium text-green-700"
          aria-describedby={`${badgeId}-desc`}
        >
          <CheckCircle2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
          Approved
          <VisuallyHidden id={`${badgeId}-desc`}>This document has been reviewed and approved</VisuallyHidden>
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span 
          className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-small font-medium text-red-700"
          aria-describedby={`${badgeId}-desc`}
        >
          <XCircle className="h-4 w-4" width={16} height={16} aria-hidden="true" />
          Rejected
          <VisuallyHidden id={`${badgeId}-desc`}>This document was rejected and needs to be replaced</VisuallyHidden>
        </span>
      );
    }
    return null;
  };

  const DocumentSection = ({
    title,
    icon: Icon,
    documentType,
    documentUrl,
    documentStatus,
    verificationId,
  }: {
    title: string;
    icon: React.ElementType;
    documentType: string;
    documentUrl?: string;
    documentStatus?: string;
    verificationId: number;
  }) => {
    const isReviewing = reviewingId === verificationId;
    const isPending = !documentStatus || documentStatus === "pending";

    return (
      <div className="rounded-lg border border-sage/20 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-sage" width={16} height={16} aria-hidden="true" />
            <span className="font-medium text-charcoal">{title}</span>
          </div>
          {getStatusBadge(documentStatus, documentType)}
        </div>

        {documentUrl ? (
          <div className="mb-3">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-small text-forest hover:underline"
              aria-label={`View ${title} document (opens in new tab)`}
            >
              <Eye className="h-4 w-4" width={16} height={16} aria-hidden="true" />
              View Document
            </a>
          </div>
        ) : (
          <p className="mb-3 text-small text-charcoal/60">No document uploaded</p>
        )}

        {isPending && documentUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(verificationId, documentType)}
              disabled={isReviewing}
              className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-small font-medium text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-green-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/50 focus-visible:ring-offset-2"
            >
              {isReviewing ? (
                <span role="status" aria-live="polite" className="inline-flex items-center">
                  <Loader2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                  <VisuallyHidden>Approving {documentType || "verification"}...</VisuallyHidden>
                </span>
              ) : (
                <CheckCircle2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
              )}
              Approve
            </button>
            <button
              onClick={() => handleReject(verificationId, documentType)}
              disabled={isReviewing}
              aria-busy={isReviewing ? "true" : "false"}
              className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-small font-medium text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:ring-offset-2"
            >
              {isReviewing ? (
                <span role="status" aria-live="polite" className="inline-flex items-center">
                  <Loader2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                  <VisuallyHidden>Rejecting {documentType || "verification"}...</VisuallyHidden>
                </span>
              ) : (
                <XCircle className="h-4 w-4" width={16} height={16} aria-hidden="true" />
              )}
              Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  if (verifications.length === 0) {
    return (
      <div className="rounded-xl border border-sage/20 bg-white p-8 text-center">
        <p className="text-charcoal/70">No pending verifications to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {verifications.map((verification) => {
        const provider = verification.providers;
        const isReviewing = reviewingId === verification.id;

        return (
          <div
            key={verification.id}
            className="rounded-xl border border-sage/20 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-title font-semibold text-charcoal">
                  {provider?.name || `Provider #${verification.provider_id}`}
                </h3>
                {provider?.town && (
                  <p className="text-small text-charcoal/70">{provider.town}</p>
                )}
                {provider?.contact_email && (
                  <p className="text-small text-charcoal/70">{provider.contact_email}</p>
                )}
                <p className="mt-1 text-small text-charcoal/50">
                  Submitted: {formattedDates[verification.id] || "Loading..."}
                </p>
              </div>
              {getStatusBadge(verification.overall_status)}
            </div>

            <div className="mb-4 space-y-3">
              <DocumentSection
                title="ID Document"
                icon={Shield}
                documentType="id"
                documentUrl={verification.id_document_url}
                documentStatus={verification.id_document_status}
                verificationId={verification.id}
              />

              <DocumentSection
                title="Insurance Certificate"
                icon={FileText}
                documentType="insurance"
                documentUrl={verification.insurance_document_url}
                documentStatus={verification.insurance_document_status}
                verificationId={verification.id}
              />

              <DocumentSection
                title="Qualifications"
                icon={GraduationCap}
                documentType="qualifications"
                documentUrl={verification.qualifications_document_url}
                documentStatus={verification.qualifications_document_status}
                verificationId={verification.id}
              />
            </div>

            <div className="border-t border-sage/20 pt-4">
              <div className="mb-3">
                <label htmlFor={rejectionReasonId} className="mb-1 block text-small font-medium text-charcoal">
                  Rejection Reason (if rejecting)
                </label>
                <textarea
                  id={rejectionReasonId}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this verification is being rejected..."
                  className="ph-input w-full"
                  rows={2}
                />
              </div>
              <div className="mb-3">
                <label htmlFor={verificationNotesId} className="mb-1 block text-small font-medium text-charcoal">
                  Notes (optional)
                </label>
                <textarea
                  id={verificationNotesId}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  className="ph-input w-full"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(verification.id)}
                  disabled={isReviewing}
                  className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-small font-medium text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-green-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/50 focus-visible:ring-offset-2"
                >
                  {isReviewing ? (
                    <span role="status" aria-live="polite" className="inline-flex items-center">
                      <Loader2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                      <VisuallyHidden>Approving all documents...</VisuallyHidden>
                    </span>
                  ) : (
                    <CheckCircle2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                  )}
                  Approve All
                </button>
                <button
                  onClick={() => handleReject(verification.id)}
                  disabled={isReviewing || !rejectionReason.trim()}
                  aria-busy={isReviewing ? "true" : "false"}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-small font-medium text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none hover:bg-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50 focus-visible:ring-offset-2"
                >
                  {isReviewing ? (
                    <span role="status" aria-live="polite" className="inline-flex items-center">
                      <Loader2 className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                      <VisuallyHidden>Rejecting all documents...</VisuallyHidden>
                    </span>
                  ) : (
                    <XCircle className="h-4 w-4" width={16} height={16} aria-hidden="true" />
                  )}
                  Reject All
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

