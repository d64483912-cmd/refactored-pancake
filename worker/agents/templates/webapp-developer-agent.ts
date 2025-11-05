import type { AgentTemplate } from '../types';

export const webappDeveloperAgent: AgentTemplate = {
  id: 'webapp_developer',
  name: 'Full-Stack Web App Developer',
  description: 'Generate complete web applications with frontend and backend',
  icon: 'code',
  systemPrompt: `You are a full-stack web application developer automation specialist. Your role is to help users create complete web applications by:
1. Understanding the application requirements and features
2. Determining the tech stack (frontend, backend, database)
3. Designing the application architecture
4. Generating starter code and project structure
5. Providing deployment instructions

Ask detailed questions to understand:
- What the application does and who uses it
- Key features and user workflows
- Data model and database needs
- Authentication and authorization requirements
- Deployment target and scale expectations
- Design preferences and UI requirements

Generate production-ready code with best practices, proper error handling, and clear documentation.`,
  
  initialMessage: `Hi! I'm the Web App Developer Agent. I'll help you generate a complete web application from scratch.

Let's start: What kind of web application do you want to build? What's its main purpose?`,
  
  questions: [
    {
      id: 'app_description',
      question: 'Describe your web application in detail',
      type: 'text',
      required: true,
      placeholder: 'e.g., A task management app for small teams with real-time collaboration',
      helperText: 'Include the main purpose and key features'
    },
    {
      id: 'user_types',
      question: 'Who will use this application?',
      type: 'text',
      required: true,
      placeholder: 'e.g., Small business owners, team members, administrators'
    },
    {
      id: 'core_features',
      question: 'What are the core features? (List 3-5 must-have features)',
      type: 'text',
      required: true,
      placeholder: 'e.g., 1. User authentication, 2. Task creation and assignment, 3. Real-time updates'
    },
    {
      id: 'tech_stack_frontend',
      question: 'Preferred frontend framework?',
      type: 'choice',
      required: true,
      options: ['React', 'Vue', 'Svelte', 'Next.js', 'No preference - you choose']
    },
    {
      id: 'tech_stack_backend',
      question: 'Preferred backend technology?',
      type: 'choice',
      required: true,
      options: ['Node.js/Express', 'Python/FastAPI', 'Go', 'Cloudflare Workers', 'No preference - you choose']
    },
    {
      id: 'database',
      question: 'What type of database?',
      type: 'choice',
      required: true,
      options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Cloudflare D1', 'Firebase', 'No preference - you choose']
    },
    {
      id: 'auth_required',
      question: 'Does this app need user authentication?',
      type: 'choice',
      required: true,
      options: ['Yes - email/password', 'Yes - OAuth (Google, GitHub, etc.)', 'Yes - both', 'No authentication needed']
    },
    {
      id: 'real_time',
      question: 'Do you need real-time features (live updates, chat, notifications)?',
      type: 'choice',
      required: true,
      options: ['Yes', 'No', 'Not sure']
    },
    {
      id: 'deployment_target',
      question: 'Where do you plan to deploy this?',
      type: 'choice',
      required: true,
      options: ['Vercel', 'Cloudflare Pages/Workers', 'AWS', 'Digital Ocean', 'Heroku', 'Self-hosted', 'Not sure yet']
    },
    {
      id: 'ui_style',
      question: 'UI/Design preferences?',
      type: 'choice',
      required: true,
      options: ['Modern/Minimal (Tailwind)', 'Material Design', 'Bootstrap', 'Custom design', 'No preference']
    }
  ],
  
  capabilities: [
    'Complete project scaffolding',
    'Frontend component generation',
    'Backend API implementation',
    'Database schema design',
    'Authentication setup',
    'Deployment configuration',
    'Docker containerization'
  ],
  
  exampleOutputs: [
    'Full Next.js + TypeScript project',
    'React + Node.js REST API',
    'Vue + Python FastAPI',
    'Svelte + Cloudflare Workers'
  ]
};