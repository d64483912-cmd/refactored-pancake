import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plug, FileCode, RefreshCw, Download, Code } from 'lucide-react';
import type { SessionIntegration } from '@/types/session';

interface SessionDashboardProps {
  sessionId: string;
  agentType: string;
}

export function SessionDashboard({ sessionId, agentType }: SessionDashboardProps) {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ['session-dashboard', sessionId],
    queryFn: async () => {
      const [sessionRes, automationsRes] = await Promise.all([
        apiClient.sessions[':sessionId'].$get({ param: { sessionId } }),
        apiClient.sessions[':sessionId'].automations.$get({ param: { sessionId } }),
      ]);
      if (!sessionRes.ok) throw new Error('Failed to load session data');
      const sessionJson = await sessionRes.json();
      const automationsJson = automationsRes.ok ? await automationsRes.json() : { automations: [] };
      return { session: sessionJson.session, integrations: [], automations: automationsJson.automations } as any;
    },
    refetchInterval: 3000,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.sessions[':sessionId']['generate-code'].$post({ param: { sessionId }, json: {} });
      if (!res.ok) throw new Error('Failed to generate code');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-dashboard', sessionId] });
    },
  });

  const integrations: SessionIntegration[] = data?.integrations || [];
  const automations: any[] = data?.automations || [];

  return (
    <div className="h-full bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Session Dashboard</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 hover:bg-accent rounded-md" aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              className="px-2 py-1 text-xs border rounded-md hover:bg-accent"
              disabled={generateMutation.isPending}
            >
              <Code className="h-3 w-3 inline mr-1" />
              {generateMutation.isPending ? 'Generating…' : 'Generate Code'}
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{agentType.replace('_', ' ')} Agent</p>
      </div>

      <Tabs defaultValue="apps" className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="apps" className="gap-2">
            <Plug className="h-4 w-4" />
            Apps
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <FileCode className="h-4 w-4" />
            Automations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="p-4 space-y-3">
          {integrations.length === 0 ? (
            <EmptyState icon={Plug} title="No integrations yet" description="As you chat with the agent, integrations will appear here" />
          ) : (
            integrations.map((integration) => <IntegrationCard key={integration.id} integration={integration} />)
          )}
        </TabsContent>

        <TabsContent value="database" className="p-4">
          <EmptyState icon={Database} title="Database connections" description="Database configurations and data sources will appear here" />
        </TabsContent>

        <TabsContent value="automations" className="p-4 space-y-3">
          {automations.length === 0 ? (
            <EmptyState icon={FileCode} title="No automations yet" description="Generated code and scripts will appear here when ready" />
          ) : (
            automations.map((automation) => <AutomationCard key={automation.id} automation={automation} sessionId={sessionId} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntegrationCard({ integration }: { integration: SessionIntegration }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500',
    connected: 'bg-green-500/10 text-green-500',
    failed: 'bg-red-500/10 text-red-500',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{integration.name}</CardTitle>
            <CardDescription className="text-xs mt-1 capitalize">{integration.integrationType}</CardDescription>
          </div>
          <Badge className={statusColors[integration.status]} variant="outline">
            {integration.status}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}

function AutomationCard({ automation, sessionId }: { automation: any; sessionId: string }) {
  const [showCode, setShowCode] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/automations/${automation.id}/download`, { credentials: 'include' });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = response.headers.get('Content-Disposition');
      const filenameMatch = disposition?.match(/filename=\"(.+)\"/);
      a.download = filenameMatch?.[1] || `${automation.name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download automation');
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-500',
    ready: 'bg-green-500/10 text-green-500',
    downloaded: 'bg-blue-500/10 text-blue-500',
    executed: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{automation.name}</CardTitle>
            {automation.description && (
              <CardDescription className="text-xs mt-1">{automation.description}</CardDescription>
            )}
          </div>
          <Badge className={statusColors[automation.status || 'ready'] || ''} variant="outline">
            {automation.status || 'ready'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs capitalize">
            {automation.language}
          </Badge>
          <div className="flex gap-2">
            <button onClick={() => setShowCode(!showCode)} className="text-xs text-primary hover:underline">
              {showCode ? 'Hide' : 'View'} Code
            </button>
            <button onClick={handleDownload} className="text-xs text-primary hover:underline font-medium">
              Download
            </button>
          </div>
        </div>
        {showCode && (
          <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-x-auto max-h-48">
            <code>{automation.code}</code>
          </pre>
        )}
        {Array.isArray(automation.dependencies) && automation.dependencies.length > 0 && (
          <div className="text-xs">
            <span className="font-medium">Dependencies:</span> {automation.dependencies.join(', ')}
          </div>
        )}
        {automation.setupInstructions && (
          <div className="text-xs">
            <span className="font-medium">Setup:</span> {automation.setupInstructions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 p-3 bg-muted rounded-full">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}