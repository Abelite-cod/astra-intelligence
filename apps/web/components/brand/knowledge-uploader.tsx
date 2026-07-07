"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Link2, Loader2, CheckCircle2, XCircle, FileText, Globe } from "lucide-react";
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
    if (status === "indexed") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Loader2 className="w-4 h-4 text-astra-500 animate-spin" />;
  };

  const statusLabel = (status: KnowledgeDocument["status"]) => {
    if (status === "indexed") return "Indexed";
    if (status === "failed") return "Failed";
    if (status === "processing") return "Processing…";
    return "Pending";
  };

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {(["upload", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition",
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
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
            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition",
            isDragActive
              ? "border-astra-500 bg-astra-500/5"
              : "border-border hover:border-astra-500/50 hover:bg-accent"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-12 h-12 rounded-full bg-astra-500/10 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6 text-astra-500" />
          </div>
          <p className="font-medium text-foreground">
            {isDragActive ? "Drop files here" : "Drop files or click to upload"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            PDF, DOCX, TXT, MD · Up to 20 MB per file
          </p>
        </div>
      )}

      {/* URL input */}
      {tab === "url" && (
        <form onSubmit={handleUrlIngest} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Website or page URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://yourcompany.com/about"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Label <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={urlName}
              onChange={(e) => setUrlName(e.target.value)}
              placeholder="e.g. Company About Page"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={urlMutation.isPending || !url.trim()}
            className="flex items-center gap-2 bg-astra-500 hover:bg-astra-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
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
          <h3 className="text-sm font-medium text-foreground mb-3">
            Knowledge base ({docs.length} documents)
          </h3>
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                {doc.type === "url" ? (
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.status === "indexed"
                      ? `${doc.chunk_count} chunks · ${(doc.token_count / 1000).toFixed(1)}K tokens`
                      : statusLabel(doc.status)}
                    {doc.error_message && (
                      <span className="text-red-500 ml-1">— {doc.error_message}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusIcon(doc.status)}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-muted-foreground hover:text-destructive transition text-xs"
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
