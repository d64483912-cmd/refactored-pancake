<<<<<<< HEAD
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Starfield } from "@/components/starfield";
import { Paperclip, ArrowRight, Sparkles, Code, Globe, Search } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { authClient } from "@/lib/auth";

const AGENT_OPTIONS = [
  {
    id: 'research',
    name: 'Research Agent',
    description: 'Automated research and data gathering',
    icon: Search,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'webapp_developer',
    name: 'Web App Developer',
    description: 'Generate complete web applications',
    icon: Code,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'web_crawler',
    name: 'Web Crawler',
    description: 'Extract data from websites',
    icon: Globe,
    color: 'from-green-500 to-emerald-500',
  },
];
=======
import { useState } from "react";
import { Paperclip, ArrowRight } from "lucide-react";
>>>>>>> origin/main

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [taskDescription, setTaskDescription] = useState("");
  const [fileName, setFileName] = useState("No file chosen");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAgentSelect, setShowAgentSelect] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for agent and message in URL parameters
    const agent = searchParams.get('agent');
    const message = searchParams.get('message');
    
    if (agent && ['research', 'webapp_developer', 'web_crawler'].includes(agent)) {
      setSelectedAgent(agent);
    }
    
    if (message) {
      setTaskDescription(decodeURIComponent(message));
    }
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("No file chosen");
    }
  };

  const handleSubmit = async () => {
    if (!taskDescription.trim()) {
      setError("Please describe your automation task");
      return;
    }
    
    setError(null);
    
    // If no agent selected yet, show agent selection
    if (!selectedAgent) {
      setShowAgentSelect(true);
      return;
    }
    
    setCreating(true);
    
    try {
      // Check authentication
      const { data: authData } = await authClient.getSession();
      if (!authData?.session) {
        // Redirect to sign in with return URL
        navigate('/sign-in', { state: { from: '/' } });
        return;
      }
      
      // Create session
      const res = await apiClient.sessions.$post({
        json: {
          agentType: selectedAgent as any,
          title: taskDescription.slice(0, 100), // Use first 100 chars as title
          initialMessage: taskDescription,
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to create session');
      }
      
      const data = await res.json();
      
      // Redirect to session page
      navigate(`/new/${data.sessionId}`);
      
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setCreating(false);
    }
  };
  
  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowAgentSelect(false);
    // Automatically submit after agent selection
    setTimeout(() => handleSubmit(), 100);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Automate repetitive tasks
        </h1>
        
        <p className="text-xl text-muted-foreground mb-12">
          Teach AI to do your repetitive grunt work
        </p>

<<<<<<< HEAD
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Powered by AI Agents</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Automate repetitive tasks
            </h1>
            
            <p className="text-xl text-gray-400 mb-12">
              Teach AI to do your repetitive grunt work
            </p>
          </div>

          {/* Agent Selection Modal */}
          {showAgentSelect && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#1a2332] rounded-2xl p-6 max-w-3xl w-full border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Agent</h2>
                <p className="text-gray-400 mb-6">Select the type of automation you want to create</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {AGENT_OPTIONS.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleAgentSelect(agent.id)}
                        className="group relative p-6 bg-[#0f1419] rounded-xl border border-gray-700 hover:border-cyan-400/50 transition-all text-left"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
                        <Icon className="w-8 h-8 text-cyan-400 mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">{agent.name}</h3>
                        <p className="text-sm text-gray-400">{agent.description}</p>
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setShowAgentSelect(false)}
                  className="w-full py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Main Input Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {selectedAgent && (
              <div className="mb-4 flex items-center gap-2 text-sm">
                <span className="text-gray-500">Agent:</span>
                <span className="px-3 py-1 bg-cyan-400/10 text-cyan-600 rounded-full font-medium">
                  {AGENT_OPTIONS.find(a => a.id === selectedAgent)?.name}
                </span>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setShowAgentSelect(true);
                  }}
                  className="text-cyan-600 hover:text-cyan-700 text-xs underline"
                >
                  Change
                </button>
              </div>
            )}
            
            <div className="mb-4">
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
              >
                Choose Files
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <span className="ml-3 text-sm text-gray-500">{fileName}</span>
            </div>

            <div className="mb-4">
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Describe the task you want to automate... (e.g., 'Help me research loan underwriting data from multiple sources')"
                className="w-full px-4 py-3 text-gray-700 bg-white border-0 focus:outline-none text-base resize-none"
                rows={3}
                disabled={creating}
=======
        <div className="bg-card rounded-2xl p-6 shadow-xl border">
          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-input rounded-lg text-sm font-medium bg-background hover:bg-accent cursor-pointer transition-colors"
            >
              Choose Files
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
>>>>>>> origin/main
              />
            </label>
            <span className="ml-3 text-sm text-muted-foreground">{fileName}</span>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Help me research loan underwriting data"
              className="w-full px-4 py-3 bg-background border-0 focus:outline-none text-base"
            />
          </div>

<<<<<<< HEAD
            <div className="flex items-center justify-between pt-2">
              <button
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={creating}
              >
                <Paperclip className="w-5 h-5" />
                <span className="text-sm font-medium">Attach</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={creating || !taskDescription.trim()}
                className="flex items-center justify-center w-12 h-12 bg-cyan-400 hover:bg-cyan-500 rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
=======
          <div className="flex items-center justify-between pt-2">
            <button
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm font-medium">Attach</span>
            </button>

            <button
              onClick={handleSubmit}
              className="flex items-center justify-center w-12 h-12 bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg"
            >
              <ArrowRight className="w-6 h-6 text-primary-foreground" />
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI models understand your requirements and generate production-ready code
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Multi-Language</h3>
            <p className="text-sm text-muted-foreground">
              Generate code in Python, JavaScript, TypeScript, and Bash with proper structure
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">Production Ready</h3>
            <p className="text-sm text-muted-foreground">
              Complete solutions with error handling, documentation, and setup instructions
            </p>
>>>>>>> origin/main
          </div>
          
          {/* Feature Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
              🔍 Research & Data Gathering
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
              💻 Web App Generation
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
              🌐 Web Scraping
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}