import { useMemo } from 'react';
import { useAgentsList } from '@/hooks/useAgents';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Code, Globe, Search } from 'lucide-react';

function iconFor(name: string) {
  switch (name) {
    case 'search':
      return <Search className="h-5 w-5" />;
    case 'code':
      return <Code className="h-5 w-5" />;
    case 'globe':
      return <Globe className="h-5 w-5" />;
    default:
      return <Search className="h-5 w-5" />;
  }
}

export default function AgentsPage() {
  const { data, isLoading, error } = useAgentsList();
  const agents = useMemo(() => data?.agents ?? [], [data]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Choose an Agent</h1>
          <p className="mt-1 text-sm text-muted-foreground">Specialized assistants with guided question flows for specific automation setups.</p>
        </div>

        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading agents…</div>
        )}
        {error && (
          <div className="text-sm text-red-500">Failed to load agents.</div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <Card key={a.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-md border p-2 text-muted-foreground">
                    {iconFor(a.icon)}
                  </div>
                  <CardTitle className="text-base">{a.name}</CardTitle>
                </div>
                <CardDescription>{a.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {a.capabilities.slice(0, 4).map((cap) => (
                    <Badge key={cap} variant="secondary" className="font-normal">{cap}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to={`/agents/${a.id}`}>Start</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
