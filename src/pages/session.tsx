import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { SimpleChat } from '@/components/chat/SimpleChat';
import { SessionDashboard } from '@/components/session/SessionDashboard';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth';
import type { AutomationSession } from '@/types/session';
import type { AgentTemplate } from '@/types/agent';

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<AutomationSession | null>(null);
  const [agent, setAgent] = useState<AgentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!sessionId) return;
    
    const loadSession = async () => {
      try {
        const { data: authData } = await authClient.getSession();
        if (!authData?.session) {
          navigate('/sign-in', { state: { from: `/new/${sessionId}` } });
          return;
        }
        
        const res = await apiClient.sessions[':sessionId'].$get({
          param: { sessionId }
        });
        
        if (!res.ok) {
          throw new Error('Session not found');
        }
        
        const data = await res.json() as any;
        setSession(data.session);
        
        const agentRes = await apiClient.agents[':agentType'].$get({
          param: { agentType: data.session.agentType }
        });
        
        if (agentRes.ok) {
          const agentData = await agentRes.json() as any;
          setAgent(agentData.agent);
        }
        
      } catch (err: any) {
        console.error('Failed to load session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
  }, [sessionId, navigate]);
  
  const { messages, stop, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
    body: {
      sessionId,
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      systemPrompt: agent?.systemPrompt,
    },
    initialMessages: agent ? [{
      id: 'initial',
      role: 'assistant',
      content: agent.initialMessage || '',
    }] : [],
  });
  
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage: any = (messages as any)[messages.length - 1];
    if (!lastMessage || !sessionId) return;
    
    apiClient.sessions[':sessionId'].messages.$post({
      param: { sessionId },
      json: {
        role: lastMessage.role as 'user' | 'assistant' | 'system',
        content: typeof lastMessage.content === 'string' ? lastMessage.content : String(lastMessage.content || ''),
      }
    });
  }, [messages, sessionId]);
  
  const uiMessages = useMemo(() => {
    return (messages as any).map((m: any, idx: number) => ({
      id: m.id || String(idx),
      role: m.role as 'user' | 'assistant' | 'system',
      content: typeof m.content === 'string' ? m.content : String(m.content),
    }));
  }, [messages]);
  
  const showThinking = useMemo(() => {
    if (status === 'submitted') return true;
    if (status !== 'streaming') return false;
    if (!uiMessages.length) return false;
    const lastMessage = uiMessages[uiMessages.length - 1];
    if (lastMessage.role !== 'assistant') return false;
    return lastMessage.content.trim().length === 0;
  }, [status, uiMessages]);
  
  const isLoading = status === 'streaming' || status === 'submitted';
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }
  
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Session Not Found</h1>
          <p className="text-muted-foreground mb-4">{error || 'This session does not exist or you do not have access to it.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex bg-background">
      <div className="flex-1 border-r">
        <SimpleChat
          messages={uiMessages}
          onSend={(text) => sendMessage({ text })}
          isLoading={isLoading}
          onStop={stop}
          title={agent?.name || 'Agent'}
          showThinking={showThinking}
        />
      </div>
      <div className="w-96 overflow-y-auto">
        <SessionDashboard sessionId={sessionId!} agentType={session.agentType} />
      </div>
    </div>
  );
}
