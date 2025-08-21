import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { NewsService } from './src/services/newsService';

// Load environment variables
dotenv.config();

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const newsApiKey = process.env.NEWS_API_KEY;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

if (!perplexityApiKey && !newsApiKey) {
  console.error('Either PERPLEXITY_API_KEY or NEWS_API_KEY must be set in environment variables');
  process.exit(1);
}

// Create a bot instance and news service
const bot = new TelegramBot(token, { polling: true });
const newsService = new NewsService(perplexityApiKey || '', newsApiKey);

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 Hello ${msg.from?.first_name || 'there'}!

Welcome to the News AI Bot! 

Available commands:
/start - Show this welcome message
/hello - Get a friendly greeting
/help - Show available commands
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Handle /hello command
bot.onText(/\/hello/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from?.first_name || 'friend';
  
  bot.sendMessage(chatId, `Hello ${userName}! 👋 How can I help you today?`);
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📋 Available Commands:

/start - Welcome message and bot introduction
/hello - Get a personalized greeting
/news - Get latest news headlines
/tech - Technology news
/business - Business & finance news
/sports - Sports news
/health - Health & medical news
/science - Science & research news
/politics - Political news
/world - World news
/entertainment - Entertainment news
/help - Show this help message

🔍 You can also send me any topic to get news about it!
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Handle /news command - latest general news
bot.onText(/\/news/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    bot.sendMessage(chatId, '📰 Fetching latest news...');
    
    const newsResponse = await newsService.getLatestNews('latest news today', 5);
    const formattedNews = formatNewsResponse(newsResponse);
    
    bot.sendMessage(chatId, formattedNews);
  } catch (error) {
    console.error('Error fetching news:', error);
    bot.sendMessage(chatId, '❌ Sorry, I couldn\'t fetch the news right now. Please try again later.');
  }
});

// Handle category-specific news commands
const newsCategories = ['tech', 'business', 'sports', 'health', 'science', 'politics', 'world', 'entertainment'];

newsCategories.forEach(category => {
  const regex = new RegExp(`\/${category}`, 'i');
  bot.onText(regex, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
      const categoryEmojis: { [key: string]: string } = {
        tech: '💻',
        business: '💼',
        sports: '⚽',
        health: '🏥',
        science: '🔬',
        politics: '🏛️',
        world: '🌍',
        entertainment: '🎬'
      };
      
      const emoji = categoryEmojis[category] || '📰';
      bot.sendMessage(chatId, `${emoji} Fetching ${category} news...`);
      
      const newsResponse = await newsService.getNewsByCategory(category, 5);
      const formattedNews = formatNewsResponse(newsResponse);
      
      bot.sendMessage(chatId, formattedNews);
    } catch (error) {
      console.error(`Error fetching ${category} news:`, error);
      bot.sendMessage(chatId, `❌ Sorry, I couldn't fetch ${category} news right now. Please try again later.`);
    }
  });
});

// Format news response for Telegram (plain text format to avoid parsing issues)
function formatNewsResponse(newsResponse: any): string {
  const { articles, query, timestamp } = newsResponse;
  
  if (!articles || articles.length === 0) {
    return '📰 No recent news found for your query. Please try a different topic.';
  }
  
  let formattedMessage = `📰 Latest News\n`;
  formattedMessage += `🔍 Query: ${query}\n`;
  formattedMessage += `⏰ Updated: ${new Date(timestamp).toLocaleString()}\n\n`;
  
  articles.forEach((article: any, index: number) => {
    const title = article.title || 'Untitled';
    const summary = article.summary || 'No summary available';
    const source = article.source || '';
    
    formattedMessage += `${index + 1}. ${title}\n`;
    formattedMessage += `${summary}\n`;
    
    if (source) {
      formattedMessage += `📍 Source: ${source}\n`;
    }
    
    if (article.url) {
      formattedMessage += `🔗 Read more: ${article.url}\n`;
    }
    
    formattedMessage += '\n';
  });
  
  return formattedMessage;
}

// Handle any text message that doesn't match commands
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  // Skip if it's a command (starts with /)
  if (messageText?.startsWith('/')) {
    return;
  }
  
  // If message is longer than 3 characters, treat it as a news query
  if (messageText && messageText.length > 3) {
    try {
      bot.sendMessage(chatId, `🔍 Searching for news about "${messageText}"...`);
      
      const newsResponse = await newsService.getLatestNews(messageText, 3);
      const formattedNews = formatNewsResponse(newsResponse);
      
      bot.sendMessage(chatId, formattedNews);
    } catch (error) {
      console.error('Error fetching custom news:', error);
      bot.sendMessage(chatId, `❌ Sorry, I couldn't find news about "${messageText}". Please try again later or use /help to see available commands.`);
    }
  } else {
    // Simple response for short messages
    bot.sendMessage(chatId, `You said: "${messageText}"\n\nTry sending me a topic to get news about it, or use /help to see available commands! 😊`);
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');
console.log('Press Ctrl+C to stop the bot');