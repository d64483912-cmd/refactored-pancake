# Minimal Starter

A clean, minimal starter template providing the perfect foundation for your next project. Built with modern tools and ready for your creativity.

## ✨ Features

- 🚀 **Modern Stack**: React 19, TypeScript, Vite, Tailwind CSS
- 🎨 **Beautiful UI**: shadcn/ui components with customizable design tokens
- 📱 **Responsive**: Mobile-first design with dark/light theme support
- ⚡ **Performance**: Cloudflare Workers backend with sub-second response times
- 🗄️ **Database**: Drizzle ORM with D1 database
- 🧪 **Type Safety**: Comprehensive TypeScript setup
- 🔧 **Developer Experience**: Hot reload, ESLint, and modern tooling

## 🏗️ Architecture

```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   │   └── ui/            # shadcn/ui base components
│   ├── pages/             # Page components
│   ├── lib/               # Utilities and helpers
│   └── styles/            # Global styles and themes
├── worker/                # Cloudflare Workers backend
│   ├── routes/            # API routes
│   └── db/                # Database schema and migrations
├── public/                # Static assets (Vite standard)
│   ├── favicon.svg        # Site favicon
│   └── *.{png,jpg,svg}    # Images, logos, etc.
└── instructions/          # Documentation for adding features
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js
- [Cloudflare account](https://cloudflare.com/) for deployment

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd minimal-starter-template
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
bun run dev
```

5. Visit `http://localhost:5173` to see your application.

## 📦 Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run pre-deploy` - Generate database migrations
- `bun run db:generate` - Generate database types

## 🎨 Customization

### Theming

The template uses semantic design tokens defined in `src/styles/global.css`. Customize colors, spacing, and typography by modifying the CSS custom properties.

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/app.tsx`
3. Update navigation as needed

### Components

- Reusable components go in `src/components/`
- Use shadcn/ui as a base for new components
- Follow the existing patterns for props and styling

## 🌐 Deployment

### Cloudflare Workers

1. Install Wrangler CLI:
```bash
bunx wrangler login
```

2. Configure your environment variables in Wrangler
3. Deploy:
```bash
bun run pre-deploy
bunx wrangler deploy
```

### Environment Variables

Key environment variables to configure:

```env
# Database
D1_DATABASE_NAME=your-database-name

# Authentication (if enabled)
BETTER_AUTH_SECRET=your-auth-secret
VITE_BETTER_AUTH_URL=https://your-domain.com

# Additional services as needed
```

## 📚 Documentation

- [Database Guide](./instructions/database.md)
- [Theming](./instructions/theming.md)
- [Static Assets](./instructions/assets.md)
- [Authentication](./instructions/authentication.md)
- [Billing](./instructions/billing.md)

## 🛠️ Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Semantic HTML and accessibility

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Minimal Starter** - Your creative canvas awaits. 🎨