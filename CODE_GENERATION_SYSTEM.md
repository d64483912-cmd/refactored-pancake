# AI-Powered Code Generation System

This document describes the AI-powered code generation system that produces ready-to-use scripts and applications based on session conversations.

## Features

- **Multi-language Support**: Generate code in Python, JavaScript, TypeScript, and Bash
- **Agent-Specific Generation**: Tailored code generation for different agent types (Research, Web App Developer, Web Crawler, etc.)
- **Production-Ready Code**: Includes error handling, logging, documentation, and setup instructions
- **Session Management**: Track conversations and generated code in persistent sessions
- **Download Management**: Download generated code with proper file extensions
- **Status Tracking**: Track code generation status (draft → ready → downloaded)

## Architecture

### Database Schema

The system uses three main database tables:

1. **automation_sessions**: Stores session metadata and configuration
2. **session_messages**: Tracks conversation history for context
3. **session_automations**: Stores generated code and metadata

### Backend Components

1. **Code Generator Service** (`worker/services/code-generator.ts`)
   - Integrates with OpenRouter AI API
   - Builds agent-specific prompts
   - Parses and validates generated code

2. **Session Routes** (`worker/routes/session-routes.ts`)
   - RESTful API for session management
   - Code generation endpoints
   - File download functionality

### Frontend Components

1. **Session Dashboard** (`src/components/session/SessionDashboard.tsx`)
   - Session list and management
   - Chat interface for requirements gathering
   - Code generation and download
   - Automation status tracking

2. **Navigation** (`src/components/Navigation.tsx`)
   - Main navigation with auth state
   - Role-based route visibility
   - Sign in/out functionality

## Usage Flow

1. **Create Session**: Users create a new automation session with:
   - Session title
   - Agent type (Research, Web App Developer, Web Crawler, etc.)
   - Requirements (one per line)
   - Tech stack preferences
   - Constraints

2. **Chat with AI**: Users converse with the AI assistant to:
   - Refine requirements
   - Provide additional context
   - Discuss implementation details

3. **Generate Code**: Users trigger code generation with:
   - Optional language preference
   - AI analyzes conversation history
   - Generates production-ready code

4. **Review & Download**: Users can:
   - View generated code inline
   - Check dependencies and setup instructions
   - Download files with proper extensions
   - Track download status

## Code Generation Details

### Agent Types

The system supports different agent types with specialized prompts:

- **Research Agent**: Focuses on web scraping, data processing, and storage
- **Web App Developer**: Generates full-stack applications with database schemas
- **Web Crawler**: Implements robust crawling with rate limiting and duplicate detection
- **Data Analyst**: Creates data processing and analysis pipelines
- **Automation Engineer**: Builds general automation scripts

### Code Quality

Generated code includes:
- Proper error handling and logging
- Environment variable configuration
- Clear comments and documentation
- Setup and installation instructions
- Example usage patterns

### File Structure

The system can generate multiple files for complex projects:
- Separate files for different components
- Proper project structure
- Configuration files
- Database schemas and migrations

## API Endpoints

### Session Management
- `GET /api/sessions` - List user sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:sessionId` - Get session details

### Message Management
- `GET /api/sessions/:sessionId/messages` - Get session messages
- `POST /api/sessions/:sessionId/messages` - Add message to session

### Automation Management
- `GET /api/sessions/:sessionId/automations` - Get session automations
- `POST /api/sessions/:sessionId/generate-code` - Generate automation code
- `GET /api/sessions/:sessionId/automations/:automationId/download` - Download automation

## Environment Variables

The system requires:
- `OPENROUTER_API_KEY`: API key for OpenRouter AI service

## Database Migrations

To update the database schema:
```bash
bun run pre-deploy
```

This will create migration files that need to be applied to your D1 database.

## Type Safety

The entire system is type-safe with:
- TypeScript interfaces for all data structures
- Zod validation for API inputs
- Drizzle ORM with type-safe database operations
- Hono client with type-safe API calls

## Development

After making changes:
```bash
# Typecheck frontend
bun x tsc --noEmit -p ./tsconfig.app.json

# Typecheck worker
bun x tsc --noEmit -p ./tsconfig.worker.json

# Typecheck node
bun x tsc --noEmit -p ./tsconfig.node.json
```

## Future Enhancements

- Support for more programming languages
- Code execution and testing environment
- Version control for generated code
- Collaboration features for team sessions
- Integration with version control systems
- Code review and optimization suggestions