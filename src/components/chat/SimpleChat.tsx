import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface SimpleChatProps {
  messages: Pick<Message, "id" | "role" | "content">[];
  onSend: (text: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  title?: string;
  placeholder?: string;
  className?: string;
  showHeader?: boolean;
  emptyState?: React.ReactNode;
  compact?: boolean;
  maxHeight?: number | string;
  showThinking?: boolean;
  thinkingIndicator?: React.ReactNode;
}

export function SimpleChat({
  messages,
  onSend,
  isLoading = false,
  onStop,
  title = "Chat",
  placeholder = "Type your message...",
  className,
  showHeader = true,
  emptyState,
  compact = false,
  maxHeight,
  showThinking = true,
  thinkingIndicator,
}: SimpleChatProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const displayMessages = useMemo(
    () =>
      messages.filter((m, idx) => {
        if (m.role !== "assistant") return true;
        if (typeof m.content !== "string") return true;
        const isLast = idx === messages.length - 1;
        return !(isLast && m.content.trim().length === 0);
      }),
    [messages]
  );

  const handleSubmit = useCallback(() => {
    const text = draft.trim();
    if (!text || isLoading) return;
    onSend(text);
    setDraft("");
  }, [draft, isLoading, onSend]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const hasMessages = displayMessages && displayMessages.length > 0;
  const containerHeightClass = maxHeight ? "" : "h-full";
  const messagesStyle =
    maxHeight ?
      {
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        overflowY: "auto" as const,
      }
    : undefined;

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        containerHeightClass,
        className
      )}
    >
      {showHeader && (
        <div
          className={cn(
            "border-b bg-background/95 backdrop-blur-sm",
            compact ? "px-3 py-2" : "px-4 py-3"
          )}
        >
          <h2
            className={cn(
              "font-semibold tracking-tight",
              compact ? "text-sm" : "text-base"
            )}
          >
            {title}
          </h2>
        </div>
      )}

      <div
        className={cn(maxHeight ? "flex-none" : "flex-1", "overflow-y-auto")}
        style={messagesStyle}
      >
        {!hasMessages && !isLoading ?
          <div className="flex h-full items-center justify-center p-8">
            {emptyState ?? (
              <div className="text-center text-sm text-muted-foreground">
                Start the conversation by sending a message.
              </div>
            )}
          </div>
        : <div
            className={cn(
              "mx-auto w-full max-w-3xl px-4 md:px-6 lg:px-8",
              compact ? "space-y-2 py-4" : "space-y-3 py-6"
            )}
          >
            {displayMessages.map((m) => (
              <MessageRow
                key={m.id}
                role={m.role}
                content={m.content}
                compact={compact}
              />
            ))}
            {showThinking &&
              isLoading &&
              (thinkingIndicator ?? <AssistantThinking compact={compact} />)}
            <div ref={endRef} />
          </div>
        }
      </div>

      <div className="border-t bg-background/95 backdrop-blur-sm">
        <div
          className={cn(
            "mx-auto max-w-3xl md:px-6 lg:px-8",
            compact ? "px-3 py-2" : "px-4 py-3"
          )}
        >
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                aria-label="Chat message input"
                className={cn(
                  "w-full resize-none rounded-lg border bg-background text-sm",
                  compact ? "px-2.5 py-2" : "px-3 py-2",
                  "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                style={{ height: "auto" }}
              />
            </div>

            <button
              type="button"
              onClick={isLoading ? onStop : handleSubmit}
              disabled={!draft.trim() && !isLoading}
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium",
                compact ? "h-9 px-2.5" : "h-10 px-3",
                "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
              )}
              aria-label={isLoading ? "Stop generation" : "Send message"}
            >
              {isLoading ? "Stop" : "Send"}
            </button>
          </div>
          <p
            className={cn(
              "text-center text-xs text-muted-foreground",
              compact ? "mt-1" : "mt-2"
            )}
          >
            Enter to send • Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageRow({
  role,
  content,
  compact,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  compact?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("group w-full", compact ? "py-1.5" : "py-2")}>
      <div
        className={cn("mx-auto flex max-w-3xl", compact ? "gap-2.5" : "gap-3")}
      >
        <div
          className={cn(
            "mt-0.5 flex flex-shrink-0 items-center justify-center rounded-sm",
            compact ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]",
            isUser ?
              "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
          )}
        >
          <span className="font-semibold uppercase">
            {isUser ? "You" : "AI"}
          </span>
        </div>
        <div className="flex-1">
          <div
            className={cn(
              "relative rounded-lg border bg-card text-sm shadow-sm",
              compact ? "px-2.5 py-1.5" : "px-3 py-2",
              isUser ? "border-primary/20" : "border-border"
            )}
          >
            <MessageContent content={content} />
            {!isUser && <CopyButton text={content} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantThinking({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("w-full", compact ? "py-2.5" : "py-4")}>
      <div
        className={cn("mx-auto flex max-w-3xl", compact ? "gap-2.5" : "gap-3")}
      >
        <div
          className={cn(
            "mt-0.5 flex flex-shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground",
            compact ? "h-6 w-6" : "h-7 w-7"
          )}
        >
          <span className="text-[10px] font-semibold uppercase">AI</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Thinking</span>
          <div className="flex gap-0.5">
            <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <div className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className={cn(
        "absolute -top-2 -right-2 hidden rounded-md border bg-background px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm",
        "group-hover:inline-flex hover:bg-accent hover:text-accent-foreground"
      )}
      aria-label="Copy message"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MessageContent({ content }: { content: string }) {
  // Lightweight markdown-ish rendering: code blocks, inline code, bold/italic, line breaks
  const blocks = useMemo(() => parseBlocks(content), [content]);
  return (
    <div className="max-w-none whitespace-pre-wrap break-words leading-relaxed">
      {blocks.map((b, i) =>
        b.type === "code" ?
          <CodeBlock key={i} language={b.language} code={b.code} />
        : <span
            key={i}
            dangerouslySetInnerHTML={{ __html: processInline(b.text) }}
          />
      )}
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 overflow-hidden rounded-md border bg-card">
      <div className="flex items-center justify-between border-b px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-mono">{language || "text"}</span>
        <button
          type="button"
          aria-label="Copy code"
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
          }}
          className="rounded-md px-2 py-0.5 hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="bg-muted/40 p-3 overflow-x-auto">
        <code className="text-xs">{code}</code>
      </pre>
    </div>
  );
}

function parseBlocks(
  text: string
): Array<
  | { type: "text"; text: string }
  | { type: "code"; language: string; code: string }
> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const result: Array<any> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [full, lang, code] = match;
    if (match.index > lastIndex) {
      result.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }
    result.push({ type: "code", language: lang || "text", code });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) {
    result.push({ type: "text", text: text.slice(lastIndex) });
  }
  if (result.length === 0) return [{ type: "text", text }];
  return result;
}

function processInline(text: string) {
  return text
    .replace(/\n/g, "<br />")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-[12px] font-mono">$1</code>'
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
}
