import type { UIMessage } from 'ai';

export interface ExtractedContext {
  integrations: Array<{
    type: 'email' | 'github' | 'calendar' | 'api' | 'database';
    name: string;
    config?: Record<string, any>;
  }>;
  databases: Array<{
    type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'api';
    name: string;
    config?: Record<string, any>;
  }>;
  requirements: string[];
  constraints: string[];
  techStack: string[];
}

export async function extractContextFromMessages(
  messages: any[],
  agentType: string,
  openRouterKey: string
): Promise<ExtractedContext> {
  // Create extraction prompt based on conversation
  const conversationText = messages
    .map(m => `${m.role}: ${m.content || m.text || ''}`)
    .join('\n');
  
  const extractionPrompt = `Analyze this conversation and extract structured information:

Conversation:
${conversationText}

Extract and return ONLY valid JSON with this structure:
{
  "integrations": [{"type": "email|github|calendar|api|database", "name": "descriptive name", "config": {}}],
  "databases": [{"type": "postgresql|mysql|mongodb|sqlite|api", "name": "descriptive name", "config": {}}],
  "requirements": ["list of key requirements mentioned"],
  "constraints": ["list of constraints or limitations mentioned"],
  "techStack": ["list of technologies, languages, frameworks mentioned"]
}

Focus on explicitly mentioned services, tools, and technologies. Only include items that were clearly stated in the conversation.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://godmode.space',
        'X-Title': 'Godmode Context Extraction',
      },
      body: JSON.stringify({
        model: 'google/gemini-flash-1.5:free',
        messages: [
          { role: 'system', content: 'You are a data extraction specialist. Extract structured information from conversations and return ONLY valid JSON.' },
          { role: 'user', content: extractionPrompt }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error('Context extraction failed');
    }
    
    const data = await response.json() as any;
    const extractedText = data.choices?.[0]?.message?.content || '{}';
    const extracted = JSON.parse(extractedText) as ExtractedContext;
    
    // Validate and clean extracted data
    return {
      integrations: Array.isArray(extracted.integrations) ? extracted.integrations : [],
      databases: Array.isArray(extracted.databases) ? extracted.databases : [],
      requirements: Array.isArray(extracted.requirements) ? extracted.requirements : [],
      constraints: Array.isArray(extracted.constraints) ? extracted.constraints : [],
      techStack: Array.isArray(extracted.techStack) ? extracted.techStack : [],
    };
  } catch (error) {
    console.error('Context extraction error:', error);
    return {
      integrations: [],
      databases: [],
      requirements: [],
      constraints: [],
      techStack: [],
    };
  }
}