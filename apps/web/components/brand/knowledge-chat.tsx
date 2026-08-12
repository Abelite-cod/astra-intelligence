"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, Bot, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeDocs } from "@/hooks/use-brand";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface KnowledgeChatProps {
  brandId: string;
}

// Strip markdown symbols and normalize whitespace
function cleanResponse(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")                    // # headings → plain
    .replace(/\*\*([^*]+)\*\*/g, "$1")             // **bold** → plain
    .replace(/\*([^*\n]+)\*/g, "$1")               // *italic* → plain
    .replace(/`([^`]+)`/g, "$1")                   // `code` → plain
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")       // [link](url) → text
    .replace(/^[\s]*[-*•>]\s+/gm, "")              // Remove bullet/list prefixes per line
    .replace(/\n{3,}/g, "\n\n")                    // Max 2 consecutive newlines
    .trim();
}

// Render each non-empty line as its own paragraph — preserves list structure
function ResponseText({ text }: { text: string }) {
  const clean = cleanResponse(text);
  // Split on double newlines first, then single newlines within each block
  const blocks = clean.split(/\n\n+/).filter((b) => b.trim());

  return (
    <div className="space-y-2.5">
      {blocks.map((block, i) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length === 1) {
          return <p key={i} className="leading-relaxed">{lines[0]}</p>;
        }
        // Multiple lines in one block — render as separate small paragraphs
        return (
          <div key={i} className="space-y-1.5">
            {lines.map((line, j) => (
              <p key={j} className="leading-relaxed">{line}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function KnowledgeChat({ brandId }: KnowledgeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>("all");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: docs = [] } = useKnowledgeDocs(brandId);
  const indexedDocs = docs.filter((d) => d.status === "indexed" || d.type === "url");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setError("");

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandId,
          document_id: selectedDocId === "all" ? undefined : selectedDocId,
          question,
          messages: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to get answer");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch {
      setError("Network error — make sure the server is running with start.bat");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "What is this document about?",
    "Summarise the key points",
    "What problems does this address?",
    "Who is the target audience?",
  ];

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-astra-500/10 flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5 text-astra-500" />
          </div>
          <span className="font-semibold text-sm text-foreground">Chat with your knowledge</span>
        </div>

        {/* Document selector */}
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="text-xs border border-input bg-background rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring text-muted-foreground"
        >
          <option value="all">All documents</option>
          {indexedDocs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name.length > 32 ? doc.name.slice(0, 32) + "…" : doc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-astra-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-astra-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Ask anything about your documents
              </p>
              {indexedDocs.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Upload and index a document above first.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {indexedDocs.length} document{indexedDocs.length !== 1 ? "s" : ""} ready
                </p>
              )}
            </div>
            {indexedDocs.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-astra-500/50 hover:text-astra-600 transition text-muted-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "user"
                  ? "bg-astra-500"
                  : "bg-muted border border-border"
              )}
            >
              {msg.role === "user" ? (
                <User className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-astra-500 text-white rounded-tr-none"
                  : "bg-muted text-foreground rounded-tl-none"
              )}
            >
              {msg.role === "assistant" ? (
                <ResponseText text={msg.content} />
              ) : (
                <p className="leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-500/10 px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              indexedDocs.length === 0
                ? "Upload documents first…"
                : "Ask anything about your documents…"
            }
            disabled={loading || indexedDocs.length === 0}
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || indexedDocs.length === 0}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
