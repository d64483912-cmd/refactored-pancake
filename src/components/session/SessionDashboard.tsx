import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Plus, Trash2, Database, Mail, Github, Calendar, Api } from 'lucide-react';

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

interface Integration {
  id: string;
  sessionId: string;
  integrationType: 'email' | 'github' | 'calendar' | 'api' | 'database';
  name: string;
  config: Record<string, any>;
  status: 'pending' | 'configured' | 'connected' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface SessionDashboardProps {
  sessionId: string;
  agentType?: string;
}

const integrationIcons = {
  email: Mail,
  github: Github,
  calendar: Calendar,
  api: Api,
  database: Database,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  configured: 'bg-blue-100 text-blue-800',
  connected: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

export function SessionDashboard({ sessionId, agentType }: SessionDashboardProps) {
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  
  const { data: sessionData, refetch, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const res = await apiClient.sessions[':sessionId'].$get({
        param: { sessionId },
      });
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
    enabled: !!sessionId,
  });

  const { data: messagesData } = useQuery({
    queryKey: ['session-messages', sessionId],
    queryFn: async () => {
      const res = await apiClient.sessions[':sessionId'].messages.$get({
        param: { sessionId },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!sessionId,
  });

  const extractContextMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.sessions[':sessionId']['extract-context'].$post({
        param: { sessionId },
      });
      if (!res.ok) throw new Error('Failed to extract context');
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const addIntegrationMutation = useMutation({
    mutationFn: async (data: { type: string; name: string; config?: Record<string, any> }) => {
      const res = await apiClient.sessions[':sessionId'].integrations.$post({
        param: { sessionId },
        json: data,
      });
      if (!res.ok) throw new Error('Failed to add integration');
      return res.json();
    },
    onSuccess: () => {
      setShowAddIntegration(false);
      refetch();
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const res = await apiClient.sessions[':sessionId'].integrations[':integrationId'].$delete({
        param: { sessionId, integrationId },
      });
      if (!res.ok) throw new Error('Failed to delete integration');
      return res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });

  const handleExtractContext = async () => {
    try {
      await extractContextMutation.mutateAsync();
    } catch (error) {
      console.error('Context extraction failed:', error);
    }
  };

  const handleAddIntegration = async (data: any) => {
    try {
      await addIntegrationMutation.mutateAsync(data);
    } catch (error) {
      console.error('Failed to add integration:', error);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await deleteIntegrationMutation.mutateAsync(integrationId);
    } catch (error) {
      console.error('Failed to delete integration:', error);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const session = sessionData?.session as Session;
  const integrations = (sessionData?.integrations as Integration[]) || [];
  const metadata = session?.metadata || {};
  const messages = messagesData?.messages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{session?.title || 'Session Dashboard'}</h2>
          <p className="text-muted-foreground mt-1 capitalize">{agentType ? `${agentType.replace('_', ' ')} Agent` : ''}</p>
          {session?.description && (
            <p className="text-muted-foreground mt-1">{session.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExtractContext} disabled={extractContextMutation.isPending} variant="outline" size="sm">
            {extractContextMutation.isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Extract Context
          </Button>
          <Button onClick={() => setShowAddIntegration(true)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metadata.requirements?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metadata.techStack?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {metadata.requirements?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metadata.requirements.map((req: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metadata.techStack?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metadata.techStack.map((tech: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metadata.constraints?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Constraints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metadata.constraints.map((constraint: string, index: number) => (
                <Alert key={index}>
                  <AlertDescription>{constraint}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metadata.databases?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Databases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metadata.databases.map((db: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{db.name}</div>
                      <div className="text-sm text-muted-foreground">{db.type}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{db.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <p className="text-muted-foreground">No integrations configured yet.</p>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => {
                const Icon = integrationIcons[integration.integrationType];
                return (
                  <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="text-sm text-muted-foreground">{integration.integrationType}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[integration.status]}>{integration.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteIntegration(integration.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}