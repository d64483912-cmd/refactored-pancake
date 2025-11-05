import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Code, Globe, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AGENTS = [
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Automated research and data gathering from multiple sources. Perfect for market research, competitor analysis, and data collection.',
    icon: Search,
    color: 'from-blue-500 to-cyan-500',
    capabilities: [
      'Web scraping',
      'API integration',
      'Data extraction',
      'Scheduled execution',
    ],
    useCases: [
      'Track competitor pricing',
      'Monitor news mentions',
      'Collect market data',
    ],
  },
  {
    id: 'webapp_developer',
    name: 'Full-Stack Web App Developer',
    description: 'Generate complete web applications with frontend, backend, and database. Get production-ready code instantly.',
    icon: Code,
    color: 'from-purple-500 to-pink-500',
    capabilities: [
      'React/Vue/Svelte',
      'Node.js/Python backend',
      'Database schema',
      'Authentication',
    ],
    useCases: [
      'Task management apps',
      'Dashboard applications',
      'CRUD web apps',
    ],
  },
  {
    id: 'web_crawler',
    name: 'Web Crawler',
    description: 'Extract structured data from websites with pagination, JavaScript rendering, and anti-bot handling.',
    icon: Globe,
    color: 'from-green-500 to-emerald-500',
    capabilities: [
      'JavaScript rendering',
      'Pagination handling',
      'Rate limiting',
      'Data export',
    ],
    useCases: [
      'E-commerce data extraction',
      'Directory scraping',
      'Content aggregation',
    ],
  },
];

export default function AgentsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMessage = searchParams.get('message');

  const handleSelectAgent = (agentId: string) => {
    // Navigate to home with selected agent, or directly create session
    navigate(`/?agent=${agentId}${initialMessage ? `&message=${encodeURIComponent(initialMessage)}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your AI Agent</h1>
          <p className="text-xl text-muted-foreground">
            Select the specialized agent that fits your automation needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card
                key={agent.id}
                className="group cursor-pointer hover:shadow-lg transition-all relative overflow-hidden"
                onClick={() => handleSelectAgent(agent.id)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <CardHeader>
                  <div className="mb-4">
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${agent.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Capabilities:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {agent.capabilities.map((cap, idx) => (
                        <li key={idx}>• {cap}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Use Cases:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {agent.useCases.map((useCase, idx) => (
                        <li key={idx}>• {useCase}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Select Agent
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}