import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { SessionDashboard } from '@/components/session/SessionDashboard';
import { SimpleChat } from '@/components/chat/SimpleChat';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description?: string;
  agentType: string;
  status: string;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function SessionPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await apiClient.sessions.$get();
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
  });

  // Extract session ID from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const sessionIdFromPath = pathParts[pathParts.length - 1];
    if (sessionIdFromPath && sessionIdFromPath !== 'session') {
      setSessionId(sessionIdFromPath);
    }
  }, []);

  // Auto-extract context every 3 user messages
  useEffect(() => {
    if (!sessionId) return;
    
    const userMessages = messages.filter(m => m.role === 'user');
    const newCount = userMessages.length;
    
    // Every 3 user messages, extract context
    if (newCount > 0 && newCount !== messageCount && newCount % 3 === 0) {
      setMessageCount(newCount);
      
      // Trigger context extraction
      apiClient.sessions[':sessionId']['extract-context'].$post({
        param: { sessionId }
      }).catch(err => console.error('Auto-extract failed:', err));
    }
  }, [messages, messageCount, sessionId]);

  const { messages, stop, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
    onFinish: async (message) => {
      if (sessionId && message.role === 'assistant') {
        // Save assistant message to session
        try {
          await apiClient.sessions[':sessionId'].messages.$post({
            param: { sessionId },
            json: {
              role: 'assistant',
              content: message.content,
            },
          });
        } catch (error) {
          console.error('Failed to save message:', error);
        }
      }
    },
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

  const showThinking = useMemo(() => {
    if (status === "submitted") return true;
    if (status !== "streaming") return false;
    if (!uiMessages.length) return false;
    const lastMessage = uiMessages[uiMessages.length - 1];
    if (lastMessage.role !== "assistant") return false;
    return lastMessage.content.trim().length === 0;
  }, [status, uiMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSendMessage = async (text: string) => {
    if (!sessionId) return;
    
    // Save user message to session first
    try {
      await apiClient.sessions[':sessionId'].messages.$post({
        param: { sessionId },
        json: {
          role: 'user',
          content: text,
        },
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
    
    // Then send to AI
    sendMessage({ text });
  };

  const handleCreateSession = async (data: { title: string; description?: string }) => {
    try {
      const res = await apiClient.sessions.$post({
        json: {
          title: data.title,
          description: data.description,
          agentType: 'general',
        },
      });
      
      const result = await res.json();
      setSessionId(result.sessionId);
      setShowCreateDialog(false);
      
      // Navigate to the new session
      navigate(`/session/${result.sessionId}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Sessions</h1>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Session</DialogTitle>
                </DialogHeader>
                <CreateSessionForm onSubmit={handleCreateSession} />
              </DialogContent>
            </Dialog>
          </div>

          {sessions?.sessions?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first session to start tracking conversations and extracting context.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions?.sessions?.map((session: Session) => (
                <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{session.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {session.description && (
                      <p className="text-muted-foreground mb-2">{session.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Created: {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSessionId(session.id);
                          navigate(`/session/${session.id}`);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Dashboard Panel */}
      <div className="w-96 border-r bg-background overflow-y-auto">
        <div className="p-6">
          <SessionDashboard sessionId={sessionId} />
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Session Chat</h1>
            <Button variant="ghost" onClick={() => navigate('/session')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Sessions
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <SimpleChat
            messages={uiMessages}
            onSend={handleSendMessage}
            isLoading={isLoading}
            onStop={stop}
            title="Session Chat"
            showThinking={showThinking}
          />
        </div>
      </div>
    </div>
  );
}

function CreateSessionForm({ onSubmit }: { onSubmit: (data: { title: string; description?: string }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description: description || undefined });
    setTitle('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter session title"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter session description"
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full">
        Create Session
      </Button>
    </form>
  );
}