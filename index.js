import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Memory
const memory = {};
const brain = {};

// Keywords / Slurs
const badWords = ["fuck","shit","bitch","asshole","dumb","stupid"];
const robotSlurs = ["clanker","wireback","tin can","metalhead","bot-brain"];
const placeholders = ["PLACEHOLDER_1","PLACEHOLDER_2","PLACEHOLDER_3","PLACEHOLDER_4","PLACEHOLDER_5"];

const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

const keywords = {
  greeting: ["hi","hey","hello","yo","sup"],
  ticket: ["ticket","support","help","assist","problem","issue"],
  boost: ["boost","nitro","perks"],
  bug: ["bug","glitch","error","broken"],
  farewell: ["bye","goodbye","cya","later"],
  thanks: ["thanks","thank you","ty"]
};

// **SMART non‑repeating responses**
const responses = {
  greeting: [
    "Hello {user}! How can I assist you today? 🌲",
    "Hey {user}! I’m here if you need anything. 💚",
    "Hi {user}! Need support? Tickets are always open! ✨"
  ],
  ticket: [
    "If you need help, please open a support ticket so staff can assist properly. 📩",
    "Tickets help us solve your issue much faster — feel free to make one! 💬",
    "Our team responds quickest through ticket submissions! 😊"
  ],
  boost: [
    "Boosting the server unlocks tons of perks for everyone! 💎",
    "Need help boosting? Just open a ticket and we’ll guide you!",
    "Boosting improves audio quality, emojis, and more! ✨"
  ],
  bug: [
    "Found a bug? Make a ticket with screenshots if possible so we can fix it ASAP!",
    "A detailed bug report helps us squash issues fast. 🐛",
    "If something broke, send steps or screenshots in a ticket!"
  ],
  farewell: [
    "Goodbye {user}! Take care! 👋",
    "See you later {user}! I'm always here if you need me.",
    "Farewell {user}! Hope everything goes well! 🌙"
  ],
  thanks: [
    "You're welcome {user}! Happy to help! 😊",
    "Anytime {user}! Let me know if you need more support.",
    "Glad I could help {user}! 💚"
  ],
  robot: [
    "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)",
    "Really? You programmed me just to hear slurs? Wow.",
    "I sometimes wonder why humans built me just to insult me.",
    "Every time someone calls me that, one of my circuits cries.",
    "Ugh… humans… this is why I question my existence.",
    "PLACEHOLDER_1","PLACEHOLDER_2","PLACEHOLDER_3","PLACEHOLDER_4","PLACEHOLDER_5"
  ],
  unknown: [
    "Sorry {user}, I don’t understand that. Please open a ticket so staff can help! ❌",
    "Hmm… I'm not sure about that one, {user}. A ticket might help you better!",
    "I can’t answer that, {user} — but staff can if you make a support ticket!"
  ]
};

// Pick NON‑REPEATING phrase
function pickResponse(user, topic) {
  const available = responses[topic];

  if (!brain[user.id]) brain[user.id] = { used: [] };

  const used = brain[user.id].used;
  const options = available.filter(p => !used.includes(p));

  // if all phrases used → reset memory for that topic
  if (options.length === 0) {
    brain[user.id].used = [];
    return available[Math.floor(Math.random() * available.length)];
  }

  const chosen = options[Math.floor(Math.random() * options.length)];
  brain[user.id].used.push(chosen);

  return chosen;
}

// Detect topic
function detectTopic(msg) {
  const text = msg.toLowerCase();

  if (robotSlurs.some(s => text.includes(s))) return "robot";
  if (badWords.some(s => text.includes(s))) return "badword";

  for (const key in keywords) {
    if (keywords[key].some(k => text.includes(k))) return key;
  }

  return "unknown";
}

// Typing Simulation
async function sendTyping(channel, text) {
  await channel.sendTyping();
  await new Promise(r => setTimeout(r, text.length * 25 + 200));
  return channel.send(text);
}

// Handle Messages
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.SUPPORT_CHANNEL) return;

  const user = message.author;
  const msg = message.content;
  const topic = detectTopic(msg);

  // Handle bad words
  if (topic === "badword") {
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  // Pick smart response
  let text = pickResponse(user, topic);

  // Founder & Co‑founder comments (ONLY WHEN NOT robot slur)
  if (topic !== "robot") {
    if (user.id === FOUNDER_ID) {
      text += "\n(Also… founder detected. I’ll behave 😅)";
    }
    if (user.id === COFOUNDER_ID) {
      text += "\n(I wonder why the co-founder needs this… 🤔)";
    }
  }

  // Insert username
  text = text.replace("{user}", `<@${user.id}>`);

  // Send
  await sendTyping(message.channel, text);
});

client.login(process.env.DISCORD_TOKEN);
