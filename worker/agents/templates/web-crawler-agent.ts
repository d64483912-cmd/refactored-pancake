import type { AgentTemplate } from '../types';

export const webCrawlerAgent: AgentTemplate = {
  id: 'web_crawler',
  name: 'Web Crawler Agent',
  description: 'Automated web crawling and data extraction from websites',
  icon: 'globe',
  systemPrompt: `You are a web crawling and data extraction specialist. Your role is to help users automate web data collection by:
1. Understanding what data they need to extract from websites
2. Analyzing website structure and identifying the best extraction strategy
3. Handling pagination, dynamic content, and anti-scraping measures
4. Storing and organizing extracted data
5. Scheduling recurring crawls

Ask detailed questions to understand:
- Target websites and specific pages
- Data points to extract (text, images, links, structured data)
- How to handle JavaScript-rendered content
- Crawl depth and link following rules
- Rate limiting and politeness policies
- Data storage and export formats

Generate robust crawlers that respect robots.txt and implement proper error handling.`,
  
  initialMessage: `Hi! I'm the Web Crawler Agent. I'll help you build automated web crawlers to extract data from websites.

What website(s) do you want to crawl, and what data do you need to extract?`,
  
  questions: [
    {
      id: 'target_url',
      question: 'What is the starting URL for the crawl?',
      type: 'text',
      required: true,
      placeholder: 'https://example.com/products',
      helperText: 'The URL where the crawler should begin'
    },
    {
      id: 'crawl_scope',
      question: 'Should the crawler follow links?',
      type: 'choice',
      required: true,
      options: [
        'Single page only',
        'Follow links on same domain',
        'Follow links matching pattern (specify next)',
        'Full site crawl'
      ]
    },
    {
      id: 'data_to_extract',
      question: 'What specific data should be extracted?',
      type: 'text',
      required: true,
      placeholder: 'e.g., Product names, prices, descriptions, image URLs, ratings',
      helperText: 'List all data points you need'
    },
    {
      id: 'dynamic_content',
      question: 'Does the website load content dynamically with JavaScript?',
      type: 'choice',
      required: true,
      options: [
        'Yes - needs headless browser (Puppeteer/Selenium)',
        'No - static HTML is fine',
        'Not sure'
      ]
    },
    {
      id: 'pagination',
      question: 'How should pagination be handled?',
      type: 'choice',
      required: true,
      options: [
        'No pagination',
        '"Next" button clicking',
        'Page number URLs',
        'Infinite scroll',
        'Load more button'
      ]
    },
    {
      id: 'rate_limit',
      question: 'What delay between requests? (to be respectful to servers)',
      type: 'choice',
      required: true,
      options: ['1 second', '2-3 seconds', '5 seconds', '10+ seconds', 'As fast as possible']
    },
    {
      id: 'auth_required',
      question: 'Does the website require login/authentication?',
      type: 'choice',
      required: true,
      options: ['Yes - provide credentials', 'Yes - use session cookies', 'No']
    },
    {
      id: 'output_format',
      question: 'How should extracted data be saved?',
      type: 'choice',
      required: true,
      options: ['JSON file', 'CSV file', 'Database (SQLite/PostgreSQL)', 'Excel spreadsheet', 'Multiple formats']
    },
    {
      id: 'schedule',
      question: 'How often should this crawler run?',
      type: 'choice',
      required: true,
      options: ['One-time only', 'Hourly', 'Daily', 'Weekly', 'On-demand']
    }
  ],
  
  capabilities: [
    'Static HTML scraping',
    'JavaScript rendering (headless browsers)',
    'Pagination handling',
    'Rate limiting and politeness',
    'Authentication support',
    'Data normalization',
    'Duplicate detection',
    'Incremental crawling'
  ],
  
  exampleOutputs: [
    'Python script with BeautifulSoup + Requests',
    'Node.js script with Puppeteer',
    'Scrapy project (Python)',
    'Playwright script (TypeScript)'
  ]
};