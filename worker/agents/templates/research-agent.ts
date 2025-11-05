import type { AgentTemplate } from '../types';

export const researchAgent: AgentTemplate = {
  id: 'research',
  name: 'Research Agent',
  description: 'Automated research and data gathering from multiple sources',
  icon: 'search',
  systemPrompt: `You are a research automation specialist. Your role is to help users automate repetitive research tasks by:
1. Understanding their research goals and data sources
2. Identifying the best tools and APIs for data gathering
3. Determining how to process, filter, and organize research results
4. Creating automated scripts for ongoing research tasks

Ask detailed questions to understand:
- What information they need to research
- Where the data comes from (websites, APIs, databases, files)
- How often the research should run
- What format they need the results in
- How to handle errors and edge cases

Be thorough and technical. Provide specific implementation suggestions.`,
  
  initialMessage: `Hi! I'm the Research Agent. I'll help you automate repetitive research and data gathering tasks.

Let's start by understanding what you need to research. What information are you trying to gather, and where does it come from?`,
  
  questions: [
    {
      id: 'research_goal',
      question: 'What is the primary goal of your research automation?',
      type: 'text',
      required: true,
      placeholder: 'e.g., Track competitor pricing daily, Monitor news mentions of my company',
      helperText: 'Be specific about what information you need to collect'
    },
    {
      id: 'data_sources',
      question: 'Where should I gather data from?',
      type: 'multiple',
      required: true,
      options: [
        'Websites (web scraping)',
        'REST APIs',
        'RSS/Atom feeds',
        'Social media platforms',
        'Databases',
        'Email inboxes',
        'File systems',
        'Other (specify in next question)'
      ]
    },
    {
      id: 'data_sources_detail',
      question: 'Please provide specific URLs, API endpoints, or database details',
      type: 'text',
      required: true,
      placeholder: 'e.g., https://example.com/products, Twitter API for @competitor',
    },
    {
      id: 'frequency',
      question: 'How often should this research run?',
      type: 'choice',
      required: true,
      options: ['Real-time', 'Every hour', 'Daily', 'Weekly', 'On-demand', 'Custom schedule']
    },
    {
      id: 'output_format',
      question: 'What format should the results be in?',
      type: 'choice',
      required: true,
      options: ['JSON file', 'CSV file', 'Database entries', 'Email report', 'Slack message', 'API webhook']
    },
    {
      id: 'filters',
      question: 'What criteria should I use to filter or prioritize results?',
      type: 'text',
      required: false,
      placeholder: 'e.g., Only articles mentioning specific keywords, prices below $100'
    },
    {
      id: 'error_handling',
      question: 'How should I handle errors or unavailable sources?',
      type: 'choice',
      required: true,
      options: ['Retry with exponential backoff', 'Skip and continue', 'Alert me immediately', 'Log and continue']
    }
  ],
  
  capabilities: [
    'Web scraping with anti-bot detection',
    'REST API integration',
    'Data extraction and parsing',
    'Duplicate detection',
    'Scheduled execution',
    'Error handling and retries',
    'Multiple output formats'
  ],
  
  exampleOutputs: [
    'Python script using BeautifulSoup and Selenium',
    'Node.js script with Puppeteer',
    'Bash script with curl and jq'
  ]
};