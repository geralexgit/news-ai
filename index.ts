import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  process.exit(1);
}

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

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
/help - Show this help message

More features coming soon! 🚀
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Handle any text message that doesn't match commands
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;
  
  // Skip if it's a command (starts with /)
  if (messageText?.startsWith('/')) {
    return;
  }
  
  // Simple echo with a friendly response
  bot.sendMessage(chatId, `You said: "${messageText}"\n\nI'm a simple bot for now. Try /help to see what I can do! 😊`);
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

console.log('🤖 Telegram bot is running...');
console.log('Press Ctrl+C to stop the bot');