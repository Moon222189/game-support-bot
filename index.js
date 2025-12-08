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

const SUPPORT_CHANNEL = "1443121189445959836";
const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

// Super smart support corpus (example, can expand to 500+ phrases)
const corpus = [
  // Tickets
  "Tickets are the fastest way to get help! 💬",
  "To open a ticket, click 'Support' and submit your issue.",
  "Our staff respond quickly through tickets, so submit yours anytime!",
  "Need help? Tickets are your best friend! 😄",
  // Boosting
  "Boosting improves perks and server performance. ✨",
  "Want to boost the server? Go to Server Settings → Boosts.",
  "Boosting helps everyone enjoy extra features!",
  // Greetings
  "Hi there! I’m here to assist with Forest Taggers support 💚",
  "Hello! Need help? I’ve got you covered! 😎",
  "Hey! How can I help today? ✨",
  "Good day! Let’s solve your issue together. 🌟",
  // Founder/Co-founder info
  "Moon is the founder of Forest Taggers 🌙",
  "Monkey401 is the co-founder of Forest Taggers 🐒",
  // Farewells
  "Goodbye! Have a great day! 👋",
  "See you later! Stay awesome! 😄",
  // General FAQs
  "I can help you with tickets, boosting, and other support questions.",
  "I’m here to guide you with Forest Taggers support anytime!",
  // Add hundreds more here...
];

// Bad words and robot slurs
const badWords = ["fuck", "shit", "bitch", "asshole", "dumb", "stupid"];
const robotSlurs = ["clanker", "wireback", "tin can", "metalhead", "bot-brain"];

const userContext = {};

// Simple paraphrasing helper
function paraphrase(sentence) {
  const variations = [
    sentence,
    sentence.replace("help", "assist"),
    sentence.replace("click", "press"),
    sentence.replace("submit", "send"),
    sentence.replace("need", "require"),
    sentence.replace("best friend", "fastest option"),
    sentence + " 😊",
    sentence + " ✨",
    sentence + " 😄",
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}

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

  // Match keywords
  const words = promptLower.split(/\s+/);
  let matches = corpus.filter(sentence =>
    words.some(word => sentence.toLowerCase().includes(word))
  );

  // If no direct match, fallback to general help
  if (matches.length === 0) {
    matches = ["I’m sorry, I can’t answer that 😅 — I only know Forest Taggers support."];
  }

  // Pick one or more matches randomly
  const chosen = matches[Math.floor(Math.random() * matches.length)];
  return paraphrase(chosen) + extraNote;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  await message.channel.sendTyping();

  const response = generateResponse(message.content, message.author.id);
  await message.channel.send(`@${message.author.username} ${response}`);
});

client.login(process.env.DISCORD_TOKEN);
