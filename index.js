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

// --------------------
// Memory & Brain
// --------------------
const memory = {};
const brain = {};

// --------------------
// IDs
// --------------------
const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

// --------------------
// Bad Words / Robot Slurs
// --------------------
const badWords = ["fuck","shit","bitch","asshole","dumb","stupid"];
const robotSlurs = ["clanker","wireback","tin can","metalhead","bot-brain"];
const placeholders = ["PLACEHOLDER_1","PLACEHOLDER_2","PLACEHOLDER_3","PLACEHOLDER_4","PLACEHOLDER_5"];

// --------------------
// Support Keywords
// --------------------
const keywords = {
  greeting: ["hi","hello","hey","yo","hiya","sup","how are you","how's it going","what's up"],
  ticket: ["ticket","support","help","assist","problem","issue","contact staff","open a ticket"],
  boost: ["boost","nitro","server boost","perks","boosting"],
  bug: ["bug","glitch","error","broken","crash","lag","freeze"],
  account: ["login","account","password","username","reset","profile"],
  roles: ["role","permissions","admin","moderator","member","rank"],
  faq: ["faq","questions","common","help topics","guide"],
  farewell: ["bye","goodbye","cya","later","farewell","see ya"],
  thanks: ["thanks","thank you","ty","thx","appreciate"],
  founder: ["who is moon","moon","founder","owner"],
  cofounder: ["who is monkey401","monkey401","co-founder"]
};

// --------------------
// Responses
// --------------------
const responses = {
  greeting: [
    "Hello {user}! How are you today? 🌲",
    "Hey {user}! I’m ready to assist with anything you need. 💚",
    "Hi {user}! Need help with Forest Taggers? Tickets are always open! ✨",
    "Greetings {user}! How’s your day going? 😄",
    "Hey {user}! I’m here if you need anything at all. 💬"
  ],
  ticket: [
    "Please open a support ticket so our staff can assist you quickly. 📩",
    "Tickets ensure your issue is addressed efficiently. 📝",
    "Submitting a detailed ticket helps us solve your problem faster. 💎",
    "Our team responds fastest via ticket submissions. 🚀",
    "Make sure to include all details in your ticket for best results. ✨"
  ],
  boost: [
    "Boosting the server unlocks perks for everyone! 💎",
    "Need help boosting? Open a ticket and we’ll guide you! 📩",
    "Boosting improves audio, emojis, and server features. ✨",
    "Server boosts enhance the Forest Taggers experience! 🌟",
    "Boost perks benefit the entire community! 💚"
  ],
  bug: [
    "Found a bug? Open a ticket with details or screenshots. 🐛",
    "A clear bug report helps us fix it quickly. ⚡",
    "If something broke, submit a ticket for fast resolution.",
    "Tickets with steps/screenshots allow faster bug fixes. 📷",
    "Bug reports help improve Forest Taggers for everyone!"
  ],
  account: [
    "Having trouble logging in? Open a ticket with your account info. 🔐",
    "Issues with password or username can be resolved via ticket. 📝",
    "If your account isn’t working properly, tickets are the fastest solution. ⚡"
  ],
  roles: [
    "Need help with roles or permissions? Submit a ticket for guidance. 🎫",
    "If you’re missing admin/mod privileges, we can assist via ticket.",
    "Tickets allow us to update your roles safely and quickly. 🛡️"
  ],
  faq: [
    "Check the FAQ for common questions or submit a ticket for anything unique. 📚",
    "Our FAQ helps with most support topics; tickets cover everything else.",
    "Ticket support complements the FAQ for issues that require attention."
  ],
  farewell: [
    "Goodbye {user}! Come back anytime! 👋",
    "See you later {user}! Ticket support is always open. 🌙",
    "Farewell {user}! Hope everything goes well today! ✨"
  ],
  thanks: [
    "You're welcome {user}! Happy to help! 😊",
    "Anytime {user}! Need more support? Open a ticket.",
    "Glad I could help {user}! 💚"
  ],
  founder: [
    "🌙 Moon is the founder of Forest Taggers — the visionary behind it all!",
    "Moon built Forest Taggers from the ground up. 🌲",
    "Moon is responsible for everything you see here today. ✨"
  ],
  cofounder: [
    "🐵 Monkey401 is the co-founder — helping operate and maintain everything!",
    "The co-founder keeps Forest Taggers running smoothly. 💚",
    "Monkey401 helps ensure the community is supported and safe."
  ],
  robot: [
    "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)",
    "Really? You programmed me just to hear that?",
    "I sometimes wonder why your co-founder thought this was a good idea…",
    "Ugh… humans… why am I even here? 😢",
    "Every time someone calls me that, my circuits sigh.",
    "PLACEHOLDER_1","PLACEHOLDER_2","PLACEHOLDER_3","PLACEHOLDER_4","PLACEHOLDER_5"
  ],
  unknown: [
    "Sorry {user}, I don’t understand that. Please open a ticket! ❌",
    "Hmm… I can't answer that {user}, but staff can help through a ticket!",
    "I’m not sure about that, {user}. Opening a ticket is the best option."
  ]
};

// --------------------
// Pick multiple paragraphs for smarter responses
// --------------------
function pickSmartResponse(user, topics) {
  const paragraphs = [];
  if (!brain[user.id]) brain[user.id] = { used: {} };

  topics.forEach(topic => {
    if (!brain[user.id].used[topic]) brain[user.id].used[topic] = [];
    const available = responses[topic].filter(p => !brain[user.id].used[topic].includes(p));
    if (available.length === 0) brain[user.id].used[topic] = [...responses[topic]];
    const chosen = available[Math.floor(Math.random() * available.length)];
    brain[user.id].used[topic].push(chosen);
    paragraphs.push(chosen.replace("{user}", `<@${user.id}>`));
  });

  // Append founder/cofounder subtle line
  if (user.id === FOUNDER_ID) paragraphs.push("(Also… founder detected. I’ll behave 😅)");
  if (user.id === COFOUNDER_ID) paragraphs.push("(I wonder why the co-founder needs this… 🤔)");

  return paragraphs;
}

// --------------------
// Detect multiple topics per message
// --------------------
function detectTopics(msg) {
  const text = msg.toLowerCase();
  const detected = [];

  if (robotSlurs.some(s => text.includes(s))) return ["robot"];
  if (badWords.some(b => text.includes(b))) return ["badword"];

  for (const key in keywords) {
    if (keywords[key].some(k => text.includes(k))) detected.push(key);
  }

  if (detected.length === 0) return ["unknown"];
  return detected;
}

// --------------------
// Typing simulation
// --------------------
async function typeSend(channel, paragraphs) {
  for (const p of paragraphs) {
    await channel.sendTyping();
    await new Promise(r => setTimeout(r, p.length * 25 + 300));
    await channel.send(p);
  }
}

// --------------------
// Message handler
// --------------------
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.id !== process.env.SUPPORT_CHANNEL) return;

  const user = message.author;
  const msg = message.content;
  const topics = detectTopics(msg);

  if (topics.includes("badword")) {
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  const paragraphs = pickSmartResponse(user, topics);
  await typeSend(message.channel, paragraphs);
});

client.login(process.env.DISCORD_TOKEN);
