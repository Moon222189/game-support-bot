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

// Founder / Co-founder IDs
const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

// Support channel ID
const SUPPORT_CHANNEL = "1447354370420113610";

// Robot slurs / bad words
const robotSlurs = ["clanker","wireback","tin can","metalhead","bot-brain"];
const badWords = ["fuck","shit","bitch","asshole","dumb","stupid"];

// Support keywords
const keywords = {
  greeting: ["hi","hello","hey","yo","hiya","sup","how are you","what's up"],
  ticket: ["ticket","support","help","assist","problem","issue","contact staff","open a ticket","how to open a ticket","need help","report issue"],
  boost: ["boost","nitro","server boost","perks","boosting"],
  bug: ["bug","glitch","error","broken","crash","lag","freeze"],
  account: ["login","account","password","username","reset","profile"],
  roles: ["role","permissions","admin","moderator","member","rank"],
  faq: ["faq","questions","common","help topics","guide"],
  farewell: ["bye","goodbye","cya","later","farewell","see ya"],
  thanks: ["thanks","thank you","ty","thx","appreciate"]
};

// Multi-paragraph templates
const templates = {
  greeting: [
    "Hello {user}! How are you today? 🌲",
    "Hi {user}! I hope your day is going well. 🌿",
    "Hey {user}! Need assistance? Tickets are open! ✨",
    "Greetings {user}! I’m ready to help.",
    "Welcome back {user}! Need guidance?",
    "Hey {user}, I’m here for support anytime."
  ],
  ticket: [
    "💬 Tickets are the fastest way to get help! Submit your problem and staff will respond ASAP.",
    "Step 1️⃣: Go to the #support channel. Step 2️⃣: Click 'New Ticket' or type your issue. Step 3️⃣: Staff will respond shortly! 📝",
    "For fast support, creating a ticket ensures your issue is prioritized. 📩",
    "Need help? Submit a ticket and staff will take care of it promptly. 💌",
    "A support ticket is the quickest method to solve your problem! 💚",
    "Follow these steps to open a ticket: 1. Click the ‘Open Ticket’ button, 2. Describe your problem clearly, 3. Wait for a staff member to respond."
  ],
  boost: [
    "Boosting the server unlocks perks for everyone! 💎",
    "Server boosts benefit the whole community! 💚",
    "Want perks? Boost the server and check it out! ✨"
  ],
  bug: [
    "Found a bug? Open a ticket with details or screenshots. 🐛",
    "A clear bug report helps staff fix issues fast. ⚡",
    "Report bugs via tickets for faster solutions."
  ],
  account: [
    "Having trouble logging in? Open a ticket with account info. 🔐",
    "Password or username issues? Staff can help via ticket. 📝"
  ],
  roles: [
    "Need help with roles or permissions? Submit a ticket. 🎫",
    "Tickets allow staff to safely update your roles. 🛡️"
  ],
  faq: [
    "Check the FAQ for common questions or submit a ticket for unique issues. 📚",
    "Most questions are answered in the FAQ; tickets cover the rest."
  ],
  farewell: [
    "Goodbye {user}! Come back anytime! 👋",
    "See you later {user}! Tickets are always open. 🌙"
  ],
  thanks: [
    "You're welcome {user}! Happy to help! 😊",
    "Anytime {user}! Need more support? Open a ticket."
  ],
  robot: [
    "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)",
    "Really? You programmed me just to hear that?",
    "Ugh… humans… why am I even here? 😢",
    "I sometimes wonder why I was created if only for this… 🤖",
    "Humans can be strange, but I still try to help!"
  ],
  unknown: [
    "Sorry {user}, I don’t understand that. Please open a ticket! ❌",
    "I’m not sure about that, {user}. Opening a ticket is the best option."
  ]
};

// Normalize text
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

// Detect topics
function detectTopics(msg) {
  const text = normalize(msg);
  if (robotSlurs.some(s => text.includes(s))) return ["robot"];
  if (badWords.some(b => text.includes(b))) return ["badword"];
  const detected = [];
  for (const key in keywords) {
    if (keywords[key].some(k => text.includes(k))) detected.push(key);
  }
  return detected.length ? detected : ["unknown"];
}

// Build smart multi-topic response
function buildResponse(user, topics) {
  const paragraphs = [];
  for (const topic of topics) {
    if (templates[topic]) {
      const possible = [...templates[topic]];
      const pickCount = Math.min(2, possible.length);
      for (let i = 0; i < pickCount; i++) {
        const idx = Math.floor(Math.random() * possible.length);
        paragraphs.push(possible[idx].replace("{user}", `<@${user.id}>`));
        possible.splice(idx,1);
      }
    }
  }

  // Founder / Co-founder context
  if (user.id === FOUNDER_ID) paragraphs.push("(Also… founder detected. I’ll behave 😅)");
  if (user.id === COFOUNDER_ID) paragraphs.push("(I wonder why the co-founder needs this… 🤔)");

  return paragraphs;
}

// Typing simulation
async function typeSend(channel, paragraphs) {
  for (const p of paragraphs) {
    await channel.sendTyping();
    await new Promise(r => setTimeout(r, p.length * 25 + 300));
    await channel.send(p);
  }
}

// Handle messages
client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // Only respond in support channel
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  const user = message.author;
  const msg = message.content;

  const topics = detectTopics(msg);

  if (topics.includes("badword")) {
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  const paragraphs = buildResponse(user, topics);
  await typeSend(message.channel, paragraphs);
});

// Login
client.login(process.env.DISCORD_TOKEN);
