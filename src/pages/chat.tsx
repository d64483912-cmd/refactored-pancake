import { SimpleChat } from "@/components/chat/SimpleChat";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo } from "react";

export default function ChatPage() {
  const { messages, stop, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });

  const uiMessages = useMemo(() => {
    const getMessageContent = (msg: any): string => {
      if (msg.content) return String(msg.content);
      if (msg.parts && Array.isArray(msg.parts)) {
        return msg.parts
          .filter((part: any) => part?.type === "text")
          .map((part: any) => part?.text || "")
          .join("");
      }
      return msg.text || "";
    };
    return (messages as any).map((m: any, idx: number) => ({
      id: m.id || String(idx),
      role: m.role as "user" | "assistant" | "system",
      content: getMessageContent(m),
    }));
  }, [messages]);

  // Map ChatStatus to SimpleChat's expected status type
  const showThinking = useMemo(() => {
    if (status === "submitted") return true;
    if (status !== "streaming") return false;
    if (!uiMessages.length) return false;
    const lastMessage = uiMessages[uiMessages.length - 1];
    if (lastMessage.role !== "assistant") return false;
    return lastMessage.content.trim().length === 0;
  }, [status, uiMessages]);

  // Disable input and show stop button during both submitted and streaming
  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="min-h-screen">
      <div className="h-[calc(100vh-4rem)]">
        <SimpleChat
          messages={uiMessages}
          onSend={(text) => sendMessage({ text })}
          isLoading={isLoading}
          onStop={stop}
          title="Chat"
          showThinking={showThinking}
        />
      </div>
    </div>
  );
}
