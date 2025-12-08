import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const SUPPORT_CHANNEL = "1447354370420113610";

const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

// AI support corpus
const corpus = [
  "How do I open a ticket?",
  "Tickets are the fastest way to get help! 💬",
  "To open a ticket, click 'Support' and submit your issue.",
  "Boosting improves perks and server performance. ✨",
  "Hi, I need support",
  "Hello! I can help with Forest Taggers support 💚",
  "Who is Moon?",
  "Moon is the founder of Forest Taggers 🌙",
  "Who is Monkey401?",
  "Monkey401 is the co-founder of Forest Taggers 🐒",
  "Bye",
  "Goodbye! Have a great day! 👋"
];

// Bad words and robot slurs
const badWords = ["fuck", "shit", "bitch", "asshole", "dumb", "stupid"];
const robotSlurs = ["clanker", "wireback", "tin can", "metalhead", "bot-brain"];

const userContext = {};

function generateResponse(prompt, userId) {
  const promptLower = prompt.toLowerCase();

  // Bad words
  if (badWords.some(word => promptLower.includes(word))) {
    return "❌ Sorry, Moon didn’t program me to listen to swearwords!";
  }

  // Robot slurs
  if (robotSlurs.some(slur => promptLower.includes(slur))) {
    return "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)";
  }

  // Save user context
  if (!userContext[userId]) userContext[userId] = [];
  userContext[userId].push(prompt);

  let extraNote = "";
  if (userId === FOUNDER_ID) extraNote = "\n(Also… founder detected. I’ll behave 😅)";
  if (userId === COFOUNDER_ID) extraNote = "\n(I wonder why the co-founder needs this… 🤔)";

  // Dynamic response
  let response = "";
  const words = promptLower.split(/\s+/);
  for (const sentence of corpus) {
    const sentenceLower = sentence.toLowerCase();
    if (words.some(word => sentenceLower.includes(word))) {
      response += sentence + " ";
    }
  }

  if (!response) {
    response = "I’m sorry, I can’t answer that 😅 — I only know Forest Taggers support.";
  }

  return response.trim() + extraNote;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  await message.channel.sendTyping();

  const response = generateResponse(message.content, message.author.id);
  await message.channel.send(`@${message.author.username} ${response}`);
});

client.login(process.env.DISCORD_TOKEN);
