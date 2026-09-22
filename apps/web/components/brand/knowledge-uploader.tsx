"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, CheckCircle2, XCircle, FileText, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadDocument, useIngestUrl, useKnowledgeDocs, useDeleteDocument, type KnowledgeDocument } from "@/hooks/use-brand";
import { toast } from "sonner";

interface KnowledgeUploaderProps {
  brandId: string;
}

type Tab = "upload" | "url";

export function KnowledgeUploader({ brandId }: KnowledgeUploaderProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [url, setUrl] = useState("");
  const [urlName, setUrlName] = useState("");

  const { data: docs = [], isLoading: docsLoading } = useKnowledgeDocs(brandId);
  const uploadMutation = useUploadDocument(brandId);
  const urlMutation = useIngestUrl(brandId);
  const deleteMutation = useDeleteDocument(brandId);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        toast.promise(uploadMutation.mutateAsync(file), {
          loading: `Uploading ${file.name}…`,
          success: `${file.name} queued for indexing`,
          error: `Failed to upload ${file.name}`,
        });
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
    },
    maxSize: 20 * 1024 * 1024, // 20 MB
  });

  async function handleUrlIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    toast.promise(urlMutation.mutateAsync({ url: url.trim(), name: urlName || url }), {
      loading: "Crawling URL…",
      success: "URL queued for indexing",
      error: "Failed to crawl URL",
    });
    setUrl("");
    setUrlName("");
  }

  async function handleDelete(docId: string) {
    toast.promise(deleteMutation.mutateAsync(docId), {
      loading: "Deleting…",
      success: "Document deleted",
      error: "Failed to delete",
    });
  }

  const statusIcon = (status: KnowledgeDocument["status"]) => {
    if (status === "indexed") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-400" />;
    return <Loader2 className="w-4 h-4 text-[#C8843A] animate-spin" />;
  };

  const statusLabel = (status: KnowledgeDocument["status"]) => {
    if (status === "indexed") return "Indexed";
    if (status === "failed") return "Failed";
    if (status === "processing") return "Processing…";
    return "Pending";
  };

  return (
    <div className="space-y-5">
      {/* Tab selector */}
      <div className="flex gap-0 border border-[#2A2520] rounded-sm w-fit overflow-hidden">
        {(["upload", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 text-xs font-medium transition-colors",
              tab === t
                ? "bg-[#1F1B17] text-[#F5F2EE]"
                : "text-[#6E6860] hover:text-[#B8B2A9] bg-transparent"
            )}
          >
            {t === "upload" ? "Upload files" : "Add URL"}
          </button>
        ))}
      </div>

      {/* Upload area */}
      {tab === "upload" && (
        <div
          {...getRootProps()}
          className={cn(
            "border border-dashed rounded-sm p-10 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-[#C8843A] bg-[#1F1B17]"
              : "border-[#3A3530] hover:border-[#524D47] hover:bg-[#1F1B17]"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-10 h-10 bg-[#1F1B17] border border-[#2A2520] rounded-sm flex items-center justify-center mx-auto mb-3">
            <Upload className="w-5 h-5 text-[#6E6860]" />
          </div>
          <p className="font-medium text-[#F5F2EE] text-sm">
            {isDragActive ? "Drop files here" : "Drop files or click to upload"}
          </p>
          <p className="text-xs text-[#6E6860] mt-1">
            PDF, DOCX, TXT, MD · Up to 20 MB per file
          </p>
        </div>
      )}

      {/* URL input */}
      {tab === "url" && (
        <form onSubmit={handleUrlIngest} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
              Website or page URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://yourcompany.com/about"
              className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-1.5 block">
              Label <span className="text-[#524D47] font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              placeholder="e.g. Company About Page"
              className="h-10 px-3 bg-[#161310] border border-[#3A3530] rounded-sm text-sm text-[#F5F2EE] placeholder:text-[#524D47] focus:border-[#C8843A] focus:outline-none transition-colors w-full"
            />
          </div>
          <button
            type="submit"
            disabled={urlMutation.isPending || !url.trim()}
            className="flex items-center gap-2 bg-[#C8843A] hover:bg-[#DE913A] text-[#0D0B09] text-sm font-medium px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
          >
            {urlMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            Crawl and index
          </button>
        </form>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-[#B8B2A9] uppercase tracking-[0.06em] mb-3">
            Knowledge base ({docs.length} documents)
          </h3>
          <div className="space-y-1.5">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-sm border border-[#2A2520] bg-[#161310]"
              >
                {doc.type === "url" ? (
                  <Globe className="w-4 h-4 text-[#524D47] shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-[#524D47] shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F2EE] truncate">{doc.name}</p>
                  <p className="text-xs text-[#524D47]">
                    {doc.status === "indexed"
                      ? `${doc.chunk_count} chunks · ${(doc.token_count / 1000).toFixed(1)}K tokens`
                      : statusLabel(doc.status)}
                    {doc.error_message && (
                      <span className="text-red-400 ml-1">— {doc.error_message}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusIcon(doc.status)}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-[#524D47] hover:text-red-400 transition-colors text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
