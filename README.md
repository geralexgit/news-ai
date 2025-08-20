# News AI Telegram Bot

A Telegram bot built with TypeScript that provides news updates and AI-powered features.

## Features

- 🤖 Basic Telegram bot functionality
- 📰 News fetching capabilities (coming soon)
- 🗄️ PostgreSQL database integration
- 🔧 TypeScript support with hot reload

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd news-ai
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
DATABASE_URL=postgresql://username:password@localhost:5432/news_ai_db
```

### 3. Get Telegram Bot Token

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the token and add it to your `.env` file

### 4. Run the Bot

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

## Database Installation Guide

### PostgreSQL Installation

#### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create a database user (optional)
createuser -s your_username
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres psql
```

#### Windows
1. Download PostgreSQL from [official website](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Add PostgreSQL bin directory to your PATH

#### Using Docker (Cross-platform)
```bash
# Pull and run PostgreSQL container
docker run --name news-ai-postgres \
  -e POSTGRES_DB=news_ai_db \
  -e POSTGRES_USER=your_username \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15

# Connect to the database
docker exec -it news-ai-postgres psql -U your_username -d news_ai_db
```

### Database Setup

#### Option 1: Automated Setup (Recommended)

Use the provided setup script for easy database configuration:

```bash
# Make the script executable (if not already)
chmod +x setup-db.sh

# Run the setup script
./setup-db.sh
```

The script will:
- ✅ Check if PostgreSQL is installed and running
- 🗄️ Create database and user with your chosen credentials
- 📋 Set up the complete database schema
- 🔧 Update your `.env` file automatically
- ✅ Test the database connection

#### Option 2: Manual Setup

If you prefer manual setup:

##### 1. Create Database
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE news_ai_db;

-- Create user (optional)
CREATE USER your_username WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE news_ai_db TO your_username;

-- Exit
\q
```

##### 2. Update Connection String
Update your `.env` file with the correct database URL:
```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/news_ai_db
```

##### 3. Test Connection
```bash
# Test database connection
psql "postgresql://your_username:your_password@localhost:5432/news_ai_db"
```

### Database Schema (Future Implementation)

The bot will use these tables for storing news and user data:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(255),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    category VARCHAR(100),
    keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run the built application
- `npm run watch` - Watch mode with nodemon

## Project Structure

```
news-ai/
├── index.ts          # Main bot file
├── package.json      # Dependencies and scripts
├── .env.example      # Environment variables template
├── .env              # Your environment variables (not in git)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from BotFather | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

## Troubleshooting

### Common Issues

**Bot not responding:**
- Check if your bot token is correct
- Ensure the bot is running (`npm run dev`)
- Check console for error messages

**Database connection failed:**
- Verify PostgreSQL is running
- Check your DATABASE_URL format
- Ensure database and user exist

**Permission denied:**
- Make sure your database user has proper privileges
- Check if PostgreSQL is accepting connections

### Getting Help

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Test database connection separately
4. Ensure your bot token is valid

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License