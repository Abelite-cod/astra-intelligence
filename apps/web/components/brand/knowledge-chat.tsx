"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader2, Bot, User, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKnowledgeDocs } from "@/hooks/use-brand";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface KnowledgeChatProps {
  brandId: string;
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
        setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setError("Network error — make sure the server is running with start.bat");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "What are the main topics covered in this document?",
    "Summarize the key points",
    "What problems does this address?",
    "What are the main conclusions or recommendations?",
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-astra-500" />
          <span className="font-semibold text-sm text-foreground">Chat with your knowledge</span>
        </div>

        {/* Document selector */}
        <select
          value={selectedDocId}
          onChange={(e) => setSelectedDocId(e.target.value)}
          className="text-xs border border-input bg-background rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All documents</option>
          {indexedDocs.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name.length > 30 ? doc.name.slice(0, 30) + "…" : doc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-astra-500/10 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-astra-500" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Ask anything about your documents
            </p>
            {indexedDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Upload documents in the Knowledge Base section above first.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mb-4">
                {indexedDocs.length} document{indexedDocs.length !== 1 ? "s" : ""} available
              </p>
            )}
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
                "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                msg.role === "user"
                  ? "bg-astra-500 text-white rounded-tr-none"
                  : "bg-muted text-foreground rounded-tl-none"
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="bg-muted rounded-xl rounded-tl-none px-3.5 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              indexedDocs.length === 0
                ? "Upload documents first…"
                : "Ask a question about your documents…"
            }
            disabled={loading || indexedDocs.length === 0}
            className="flex-1 px-3.5 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || indexedDocs.length === 0}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-astra-500 hover:bg-astra-600 text-white transition disabled:opacity-50 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
