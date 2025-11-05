import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plug, FileCode, RefreshCw } from 'lucide-react';
import type { SessionIntegration, SessionAutomation } from '@/types/session';

interface SessionDashboardProps {
  sessionId: string;
  agentType: string;
}

export function SessionDashboard({ sessionId, agentType }: SessionDashboardProps) {
  const { data, refetch } = useQuery({
    queryKey: ['session-dashboard', sessionId],
    queryFn: async () => {
      const res = await apiClient.sessions[':sessionId'].$get({
        param: { sessionId },
      });
      if (!res.ok) throw new Error('Failed to load session data');
      return res.json();
    },
    refetchInterval: 3000,
  });

  const integrations: SessionIntegration[] = data?.integrations || [];
  const automations: SessionAutomation[] = data?.automations || [];

  return (
    <div className="h-full bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Session Dashboard</h2>
          <button onClick={() => refetch()} className="p-2 hover:bg-accent rounded-md" aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
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
            automations.map((automation) => <AutomationCard key={automation.id} automation={automation} />)
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

function AutomationCard({ automation }: { automation: SessionAutomation }) {
  const handleDownload = () => {
    const blob = new Blob([automation.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${automation.name.replace(/\s+/g, '-').toLowerCase()}.${getFileExtension(automation.language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{automation.name}</CardTitle>
        {automation.description && <CardDescription className="text-xs">{automation.description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {automation.language}
          </Badge>
          <button onClick={handleDownload} className="text-xs text-primary hover:underline">
            Download
          </button>
        </div>
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

function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    bash: 'sh',
  };
  return extensions[language] || 'txt';
}
