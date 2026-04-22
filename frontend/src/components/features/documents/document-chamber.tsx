"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { FileStack, Search, Signature, Upload } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { apiFetch, ApiError, resolveAssetUrl } from "@/lib/api";
import type { ChamberDocument, DocumentStatus, Meeting } from "@/lib/types";
import { formatFileSize, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "./signature-pad";

type UploadFormState = {
  title: string;
  relatedMeetingId: string;
  versionGroupId: string;
  file: File | null;
};

const documentStatusTone: Record<DocumentStatus, "accent" | "warning" | "success" | "neutral"> = {
  UPLOADED: "accent",
  UNDER_REVIEW: "warning",
  SIGNED: "success",
  ARCHIVED: "neutral",
};

export const DocumentChamber = () => {
  const { token, user } = useAuth();
  const [documents, setDocuments] = useState<ChamberDocument[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [signerName, setSignerName] = useState(user?.fullName ?? "");
  const deferredSearch = useDeferredValue(search);
  const [activeSignatureDocumentId, setActiveSignatureDocumentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadFormState>({
    title: "",
    relatedMeetingId: "",
    versionGroupId: "",
    file: null,
  });

  const loadData = async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [documentList, meetingList] = await Promise.all([
        apiFetch<ChamberDocument[]>("/documents", { token }),
        apiFetch<Meeting[]>("/meetings", { token }),
      ]);

      startTransition(() => {
        setDocuments(documentList);
        setMeetings(meetingList);
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to load the document chamber.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [token]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setSignerName(user.fullName);
  }, [user]);

  const visibleDocuments = documents.filter((document) => {
    if (!deferredSearch.trim()) {
      return true;
    }

    const target = `${document.title} ${document.status} ${document.uploadedBy?.fullName ?? ""}`.toLowerCase();
    return target.includes(deferredSearch.toLowerCase());
  });

  const uploadDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token || !uploadForm.file) {
      setError("Choose a file before uploading.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("title", uploadForm.title || uploadForm.file.name);

      if (uploadForm.relatedMeetingId) {
        formData.append("relatedMeetingId", uploadForm.relatedMeetingId);
      }

      if (uploadForm.versionGroupId) {
        formData.append("versionGroupId", uploadForm.versionGroupId);
      }

      await apiFetch<ChamberDocument>("/documents/upload", {
        method: "POST",
        token,
        formData,
      });

      setUploadForm({
        title: "",
        relatedMeetingId: "",
        versionGroupId: "",
        file: null,
      });

      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to upload the document.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDocumentStatus = async (documentId: string, status: DocumentStatus) => {
    if (!token) {
      return;
    }

    try {
      await apiFetch(`/documents/${documentId}`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to update the document status.",
      );
    }
  };

  const saveSignature = async (dataUrl: string) => {
    if (!token || !activeSignatureDocumentId) {
      return;
    }

    try {
      await apiFetch(`/documents/${activeSignatureDocumentId}/sign`, {
        method: "POST",
        token,
        body: {
          signerName,
          signatureDataUrl: dataUrl,
        },
      });
      setActiveSignatureDocumentId(null);
      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to sign the document.",
      );
    }
  };

  return (
    <AppShell
      description="Upload diligence files, link them to meetings, track review states, and collect e-signatures with local or S3-backed storage."
      title="Document chamber"
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card description="Attach files to the collaboration chamber or version an existing document thread." title="Upload document">
          <form className="space-y-5" onSubmit={uploadDocument}>
            <Input
              label="Document title"
              onChange={(event) =>
                setUploadForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              value={uploadForm.title}
            />
            <Select
              label="Related meeting"
              onChange={(event) =>
                setUploadForm((current) => ({
                  ...current,
                  relatedMeetingId: event.target.value,
                }))
              }
              value={uploadForm.relatedMeetingId}
            >
              <option value="">Not linked to a meeting</option>
              {meetings.map((meeting) => (
                <option key={meeting.id} value={meeting.id}>
                  {meeting.title}
                </option>
              ))}
            </Select>
            <Input
              hint="Optional. Reuse a version group id to increment the document version."
              label="Version group id"
              onChange={(event) =>
                setUploadForm((current) => ({
                  ...current,
                  versionGroupId: event.target.value,
                }))
              }
              value={uploadForm.versionGroupId}
            />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-ink">File</span>
              <input
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                className="block w-full rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate"
                onChange={(event) =>
                  setUploadForm((current) => ({
                    ...current,
                    file: event.target.files?.[0] ?? null,
                  }))
                }
                type="file"
              />
            </label>

            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</p> : null}

            <Button disabled={isSubmitting} fullWidth size="lg" type="submit">
              <Upload className="mr-2" size={16} />
              {isSubmitting ? "Uploading..." : "Upload to chamber"}
            </Button>
          </form>
        </Card>

        <Card
          action={
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" size={16} />
              <Input
                className="pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search documents"
                value={search}
              />
            </div>
          }
          description="Shared files, review statuses, and signatures available to the current user."
          title="Document inventory"
        >
          {isLoading ? (
            <p className="text-sm text-slate">Loading documents...</p>
          ) : visibleDocuments.length ? (
            <div className="space-y-5">
              {visibleDocuments.map((document) => (
                <div className="rounded-[28px] border border-slate-100 bg-sand/70 p-5" key={document.id}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-ink">{document.title}</p>
                        <Badge tone={documentStatusTone[document.status]}>{document.status}</Badge>
                        <Badge>v{document.version}</Badge>
                      </div>
                      <p className="text-sm text-slate">
                        Uploaded {formatRelativeDate(document.createdAt)} | {formatFileSize(document.fileSize)}
                      </p>
                      <p className="text-sm text-slate">
                        Version group: {document.versionGroupId}
                      </p>
                      <p className="text-sm text-slate">
                        Shared by {document.uploadedBy?.fullName ?? "Nexus user"}
                      </p>
                      {document.signatures.length ? (
                        <p className="text-sm text-slate">
                          Signed by {document.signatures.map((signature) => signature.signerName).join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => window.open(resolveAssetUrl(document.fileUrl), "_blank", "noopener,noreferrer")}
                        variant="outline"
                      >
                        <FileStack className="mr-2" size={16} />
                        Preview
                      </Button>
                      <Select
                        onChange={(event) =>
                          void updateDocumentStatus(
                            document.id,
                            event.target.value as DocumentStatus,
                          )
                        }
                        value={document.status}
                      >
                        <option value="UPLOADED">UPLOADED</option>
                        <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                        <option value="SIGNED">SIGNED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </Select>
                      <Button
                        onClick={() =>
                          setActiveSignatureDocumentId((current) =>
                            current === document.id ? null : document.id,
                          )
                        }
                        variant="secondary"
                      >
                        <Signature className="mr-2" size={16} />
                        {activeSignatureDocumentId === document.id ? "Close signer" : "Sign"}
                      </Button>
                    </div>
                  </div>

                  {activeSignatureDocumentId === document.id ? (
                    <div className="mt-5 space-y-4 rounded-[24px] border border-dashed border-slate-200 bg-white p-5">
                      <Input
                        label="Signer name"
                        onChange={(event) => setSignerName(event.target.value)}
                        value={signerName}
                      />
                      <Textarea
                        label="Signature notes"
                        readOnly
                        value={`Signing ${document.title} for ${document.uploadedBy?.fullName ?? "the counterparty"}.`}
                      />
                      <SignaturePad onSave={(dataUrl) => void saveSignature(dataUrl)} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate">No documents in the chamber yet.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
};
