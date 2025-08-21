# AGENTS.md

## Project Overview
News AI Telegram Bot - A TypeScript-based Telegram bot that provides real-time news updates using Perplexity AI and NewsAPI. The bot supports category-specific news queries, custom search functionality, and includes PostgreSQL database integration for future user preferences and article storage.

**Architecture:**
- Main bot logic in `index.ts` with command handlers
- Modular news service in `src/services/newsService.ts`
- Dual API support (Perplexity AI primary, NewsAPI fallback)
- PostgreSQL database integration (schema ready for implementation)

## Setup Commands
```bash
npm install
cp .env.example .env
# Edit .env with your API keys and database URL
npm run dev
```

## Build & Start
```bash
# Development with hot reload
npm run dev

# Production build and start
npm run build
npm start

# Watch mode with nodemon
npm run watch
```

## Testing
Currently no tests implemented. To add testing:
```bash
# Install testing dependencies first
npm install --save-dev jest @types/jest ts-jest
# Then run tests
npm test
```

## Code Style
- TypeScript with CommonJS modules (`"type": "commonjs"`)
- Async/await pattern for API calls
- Error handling with try/catch blocks
- Modular service architecture
- Command-based bot structure with regex matching
- Markdown formatting for Telegram messages

## Environment Variables
Required environment variables (see `.env.example`):
- `TELEGRAM_BOT_TOKEN` - From @BotFather on Telegram
- `PERPLEXITY_API_KEY` - Primary news source API key
- `NEWS_API_KEY` - Fallback news source (optional but recommended)
- `DATABASE_URL` - PostgreSQL connection string

## Bot Commands Structure
- `/start` - Welcome message and introduction
- `/hello` - Personalized greeting
- `/help` - Show available commands
- `/news` - Latest general news
- Category commands: `/tech`, `/business`, `/sports`, `/health`, `/science`, `/politics`, `/world`, `/entertainment`
- Custom search: Any text message > 3 characters triggers news search

## Agent-Specific Notes
- **News Service**: Dual API architecture with automatic fallback from Perplexity to NewsAPI
- **Error Handling**: Graceful degradation with mock news as last resort
- **Message Formatting**: Uses Telegram Markdown formatting with proper escaping
- **Rate Limiting**: Consider API rate limits when making requests
- **Database Schema**: Ready for implementation in future versions (see README.md)

## Project Structure
```
news-ai/
├── index.ts                    # Main bot entry point
├── src/
│   ├── services/
│   │   └── newsService.ts     # News fetching and processing
│   └── localization/          # Future i18n support
├── setup-db.sh               # Database setup script
├── .env.example              # Environment template
└── package.json              # Dependencies and scripts
```

## Development Guidelines
- Always handle API failures gracefully
- Use TypeScript interfaces for data structures
- Implement proper error logging to console
- Format news responses consistently for Telegram
- Keep API keys secure and never commit them
- Use the existing NewsService class for all news operations

## Database Integration (Future)
- PostgreSQL schema defined in README.md
- Tables: users, articles, user_preferences
- Use `setup-db.sh` for automated database setup
- Connection via `pg` library with DATABASE_URL

## Security & Deployment
- Never commit API keys or tokens
- Use environment variables for all sensitive data
- Validate user input before processing
- Implement rate limiting for production use
- Consider using PM2 or similar for production deployment
- Database credentials should use least privilege principle
