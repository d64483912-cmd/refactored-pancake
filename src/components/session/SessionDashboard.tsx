import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Plus, Download, Code, MessageSquare, Bot, Loader2 } from 'lucide-react';

interface AutomationSession {
  id: string;
  title: string;
  agentType: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface SessionMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface SessionAutomation {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  code: string;
  dependencies?: string[];
  setupInstructions?: string;
  status: 'draft' | 'ready' | 'downloaded' | 'executed';
  createdAt: string;
  updatedAt: string;
}

export default function SessionDashboard() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({
    title: '',
    agentType: '',
    requirements: '',
    techStack: '',
    constraints: '',
  });
  const [chatMessage, setChatMessage] = useState('');
  const [generating, setGenerating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await apiClient.sessions.$get();
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
  });

  // Fetch selected session details
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', selectedSession],
    enabled: !!selectedSession,
    queryFn: async () => {
      const res = await apiClient.sessions[':sessionId'].$get({
        param: { sessionId: selectedSession! },
      });
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
  });

  // Fetch session messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['session-messages', selectedSession],
    enabled: !!selectedSession,
    queryFn: async () => {
      const res = await apiClient.sessions[':sessionId'].messages.$get({
        param: { sessionId: selectedSession! },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  // Fetch session automations
  const { data: automationsData, isLoading: automationsLoading } = useQuery({
    queryKey: ['session-automations', selectedSession],
    enabled: !!selectedSession,
    queryFn: async () => {
      const res = await apiClient.sessions[':sessionId'].automations.$get({
        param: { sessionId: selectedSession! },
      });
      if (!res.ok) throw new Error('Failed to fetch automations');
      return res.json();
    },
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: typeof newSessionForm) => {
      const res = await apiClient.sessions.$post({
        json: {
          title: data.title,
          agentType: data.agentType,
          requirements: data.requirements.split('\n').filter(r => r.trim()),
          techStack: data.techStack.split('\n').filter(t => t.trim()),
          constraints: data.constraints.split('\n').filter(c => c.trim()),
        },
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setIsCreateDialogOpen(false);
      setNewSessionForm({
        title: '',
        agentType: '',
        requirements: '',
        techStack: '',
        constraints: '',
      });
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ role, content }: { role: 'user' | 'assistant' | 'system'; content: string }) => {
      const res = await apiClient.sessions[':sessionId'].messages.$post({
        param: { sessionId: selectedSession! },
        json: { role, content },
      });
      if (!res.ok) throw new Error('Failed to add message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-messages', selectedSession] });
      setChatMessage('');
    },
  });

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (language?: string) => {
      const res = await apiClient.sessions[':sessionId']['generate-code'].$post({
        param: { sessionId: selectedSession! },
        json: language ? { language } : {},
      });
      if (!res.ok) throw new Error('Failed to generate code');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-automations', selectedSession] });
      setGenerating(false);
    },
    onError: () => {
      setGenerating(false);
    },
  });

  const handleCreateSession = () => {
    createSessionMutation.mutate(newSessionForm);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    addMessageMutation.mutate({ role: 'user', content: chatMessage });
  };

  const handleGenerateCode = (language?: string) => {
    setGenerating(true);
    generateCodeMutation.mutate(language);
  };

  const handleDownloadAutomation = async (automationId: string) => {
    try {
      const response = await fetch(
        `/api/sessions/${selectedSession}/automations/${automationId}/download`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] || 'automation.txt';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Refresh automations list
      queryClient.invalidateQueries({ queryKey: ['session-automations', selectedSession] });
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download automation');
    }
  };

  const sessions = sessionsData?.sessions || [];
  const session = sessionData?.session;
  const messages = messagesData?.messages || [];
  const automations = automationsData?.automations || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Automation Sessions</h1>
              <p className="text-sm text-muted-foreground">Manage your AI-powered code generation sessions</p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Sessions</CardTitle>
                <CardDescription>Select a session to view details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sessions yet. Create one to get started.
                  </p>
                ) : (
                  sessions.map((s: AutomationSession) => (
                    <div
                      key={s.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSession === s.id ? 'bg-primary/5 border-primary' : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedSession(s.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{s.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {s.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Bot className="h-3 w-3" />
                        <span>{s.agentType}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                {session ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{session.title}</CardTitle>
                        <CardDescription>Agent: {session.agentType}</CardDescription>
                      </div>
                      <Badge variant="outline">{session.status}</Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsChatDialogOpen(true)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Chat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateCode()}
                        disabled={generating || messages.length === 0}
                      >
                        <Code className="mr-2 h-4 w-4" />
                        {generating ? 'Generating...' : 'Generate Code'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Select a session to view details</p>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {sessionLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : session ? (
                  <Tabs defaultValue="messages" className="w-full">
                    <TabsList>
                      <TabsTrigger value="messages">Messages</TabsTrigger>
                      <TabsTrigger value="automations">Automations</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="messages" className="mt-4">
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {messagesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : messages.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No messages yet. Start a conversation to generate code.
                          </p>
                        ) : (
                          messages.map((message: SessionMessage) => (
                            <div
                              key={message.id}
                              className={`flex gap-3 ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="automations" className="mt-4">
                      <div className="space-y-4">
                        {automationsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : automations.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No automations generated yet. Generate code to see them here.
                          </p>
                        ) : (
                          automations.map((automation: SessionAutomation) => (
                            <Card key={automation.id}>
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-sm font-medium">
                                      {automation.name}
                                    </CardTitle>
                                    {automation.description && (
                                      <CardDescription className="text-xs mt-1">
                                        {automation.description}
                                      </CardDescription>
                                    )}
                                  </div>
                                  <Badge
                                    className={`${
                                      automation.status === 'ready'
                                        ? 'bg-green-500/10 text-green-500'
                                        : automation.status === 'downloaded'
                                        ? 'bg-blue-500/10 text-blue-500'
                                        : 'bg-gray-500/10 text-gray-500'
                                    }`}
                                    variant="outline"
                                  >
                                    {automation.status}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0 space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {automation.language}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadAutomation(automation.id)}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </Button>
                                </div>
                                
                                {automation.dependencies && automation.dependencies.length > 0 && (
                                  <div className="text-xs">
                                    <span className="font-medium">Dependencies:</span>{' '}
                                    {automation.dependencies.join(', ')}
                                  </div>
                                )}
                                
                                {automation.setupInstructions && (
                                  <div className="text-xs">
                                    <span className="font-medium">Setup:</span>{' '}
                                    {automation.setupInstructions}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Select a session to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Create Session Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
            <DialogDescription>Start a new automation session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                value={newSessionForm.title}
                onChange={(e) =>
                  setNewSessionForm({ ...newSessionForm, title: e.target.value })
                }
                placeholder="My automation project"
              />
            </div>
            <div>
              <Label htmlFor="agentType">Agent Type</Label>
              <Select
                value={newSessionForm.agentType}
                onValueChange={(value) =>
                  setNewSessionForm({ ...newSessionForm, agentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="research">Research Agent</SelectItem>
                  <SelectItem value="webapp_developer">Web App Developer</SelectItem>
                  <SelectItem value="web_crawler">Web Crawler</SelectItem>
                  <SelectItem value="data_analyst">Data Analyst</SelectItem>
                  <SelectItem value="automation_engineer">Automation Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="requirements">Requirements (one per line)</Label>
              <Textarea
                id="requirements"
                value={newSessionForm.requirements}
                onChange={(e) =>
                  setNewSessionForm({ ...newSessionForm, requirements: e.target.value })
                }
                placeholder="Fetch data from API&#10;Process and clean data&#10;Generate reports"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="techStack">Tech Stack (one per line)</Label>
              <Textarea
                id="techStack"
                value={newSessionForm.techStack}
                onChange={(e) =>
                  setNewSessionForm({ ...newSessionForm, techStack: e.target.value })
                }
                placeholder="Python&#10;Pandas&#10;Requests"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="constraints">Constraints (one per line)</Label>
              <Textarea
                id="constraints"
                value={newSessionForm.constraints}
                onChange={(e) =>
                  setNewSessionForm({ ...newSessionForm, constraints: e.target.value })
                }
                placeholder="Must run under 10 seconds&#10;Use minimal memory&#10;Handle errors gracefully"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={!newSessionForm.title || !newSessionForm.agentType}
            >
              Create Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat with AI Assistant</DialogTitle>
            <DialogDescription>Discuss your automation requirements</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  Start the conversation by sending a message
                </p>
              ) : (
                messages.map((message: SessionMessage) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                Send
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChatDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}