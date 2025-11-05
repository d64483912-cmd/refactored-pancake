import type { AutomationSession } from '../db/schema';

export interface CodeGenerationRequest {
  agentType: string;
  requirements: string[];
  techStack: string[];
  constraints: string[];
  conversationSummary: string;
  language?: string;
}

export interface GeneratedCode {
  name: string;
  description: string;
  language: 'python' | 'javascript' | 'typescript' | 'bash';
  code: string;
  dependencies?: string[];
  setupInstructions?: string;
}

export async function generateAutomationCode(
  request: CodeGenerationRequest,
  openRouterKey: string
): Promise<GeneratedCode[]> {
  const { agentType, requirements, techStack, conversationSummary, language } = request;
  
  // Build generation prompt based on agent type
  const prompt = buildGenerationPrompt(agentType, requirements, techStack, conversationSummary, language);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://godmode.space',
        'X-Title': 'Godmode Code Generation',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert automation engineer. Generate production-ready code with proper error handling, logging, and documentation. Return code as valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      })
    });
    
    if (!response.ok) {
      throw new Error('Code generation failed');
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse response - expect JSON with code structure
    return parseGeneratedCode(content, agentType, language);
  } catch (error) {
    console.error('Code generation error:', error);
    throw error;
  }
}

function buildGenerationPrompt(
  agentType: string,
  requirements: string[],
  techStack: string[],
  conversationSummary: string,
  preferredLanguage?: string
): string {
  const basePrompt = `Generate production-ready automation code based on these requirements:

Agent Type: ${agentType}
Requirements:
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Tech Stack: ${techStack.join(', ') || 'Choose best fit'}
${preferredLanguage ? `Preferred Language: ${preferredLanguage}` : ''}

Context: ${conversationSummary}

Generate complete, working code with:
1. Proper error handling and logging
2. Clear comments and documentation
3. Environment variable configuration
4. Setup/installation instructions
5. Example usage

Return ONLY valid JSON in this exact format:
{
  "files": [
    {
      "name": "descriptive-name",
      "description": "what this code does",
      "language": "python|javascript|typescript|bash",
      "code": "complete code here",
      "dependencies": ["package1", "package2"],
      "setupInstructions": "step by step setup"
    }
  ]
}`;

  // Add agent-specific instructions
  if (agentType === 'research') {
    return basePrompt + `\n\nFor research automation, include:
- Web scraping with proper headers and rate limiting
- Data parsing and cleaning
- Storage mechanism (JSON/CSV/database)
- Scheduling capability
- Error retry logic`;
  } else if (agentType === 'webapp_developer') {
    return basePrompt + `\n\nFor web application, include:
- Project structure with separate files for frontend/backend
- Database schema and migrations
- API endpoints with validation
- Authentication setup
- Deployment configuration`;
  } else if (agentType === 'web_crawler') {
    return basePrompt + `\n\nFor web crawler, include:
- Robust HTML parsing
- JavaScript rendering if needed (Puppeteer/Selenium)
- Pagination and link following
- Duplicate detection
- Respectful crawling (robots.txt, rate limits)`;
  }
  
  return basePrompt;
}

function parseGeneratedCode(
  content: string,
  agentType: string,
  preferredLanguage?: string
): GeneratedCode[] {
  try {
    // Try to parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.files && Array.isArray(parsed.files)) {
        return parsed.files.map((f: any) => ({
          name: f.name || 'automation',
          description: f.description || 'Generated automation code',
          language: f.language || preferredLanguage || 'python',
          code: f.code || '',
          dependencies: f.dependencies || [],
          setupInstructions: f.setupInstructions || 'No setup instructions provided',
        }));
      }
    }
    
    // Fallback: extract code blocks
    const codeBlocks = extractCodeBlocks(content);
    if (codeBlocks.length > 0) {
      return codeBlocks.map((block, idx) => ({
        name: `${agentType}-automation-${idx + 1}`,
        description: 'Generated automation code',
        language: block.language as any,
        code: block.code,
        dependencies: [],
        setupInstructions: 'See code comments for setup',
      }));
    }
    
    // Last resort: return raw content as single file
    return [{
      name: `${agentType}-automation`,
      description: 'Generated automation code',
      language: preferredLanguage as any || 'python',
      code: content,
      dependencies: [],
      setupInstructions: 'Review code for setup requirements',
    }];
  } catch (error) {
    console.error('Failed to parse generated code:', error);
    return [{
      name: 'automation',
      description: 'Generated code (parsing failed)',
      language: 'python',
      code: content,
      dependencies: [],
      setupInstructions: 'Manual review required',
    }];
  }
}

function extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }
  
  return blocks;
}