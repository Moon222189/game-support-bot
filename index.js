// index.js
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";

const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ]
});

// Config
const SUPPORT_CHANNEL = "1447354370420113610";
const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

const robotSlurs = ["clanker","wireback","tin can","metalhead","bot‑brain"];
const badWords   = ["fuck","shit","bitch","asshole","dumb","stupid"];

const keywords = {
  greeting: ["hi","hello","hey","yo","hiya","sup","how are you","what's up"],
  ticket: ["ticket","support","help","assist","problem","issue","contact staff","open a ticket","how to open a ticket","report issue"],
  boost: ["boost","nitro","server boost","perks","boosting"],
  bug: ["bug","glitch","error","broken","crash","lag","freeze"],
  account: ["login","account","password","username","reset","profile"],
  roles: ["role","permissions","admin","moderator","member","rank"],
  faq: ["faq","questions","common","help topics","guide"],
  farewell: ["bye","goodbye","cya","later","farewell","see ya"],
  thanks: ["thanks","thank you","ty","thx","appreciate"]
};

const templates = {
  greeting: [
    "Hello {user}! How are you today? 🌲",
    "Hey {user}! I’m here if you need help. 💚"
  ],
  ticket: [
    "💬 Tickets are the fastest way to get help! Submit your problem and staff will respond ASAP.",
    "Step 1️⃣: Go to the support channel and click 'New Ticket'. Step 2️⃣: Describe your issue clearly. Step 3️⃣: Wait for staff response. 📝"
  ],
  boost: [
    "Boosting the server unlocks perks for everyone! 💎",
    "Server boosts benefit the whole community! 💚"
  ],
  bug: [
    "Found a bug? Open a ticket with details or screenshots. 🐛",
    "A clear bug report helps staff fix issues fast. ⚡"
  ],
  account: [
    "Having trouble logging in? Open a ticket with account info. 🔐",
    "Password or username issues? Staff can help via ticket. 📝"
  ],
  roles: [
    "Need help with roles or permissions? Submit a ticket. 🎫"
  ],
  faq: [
    "Check the FAQ for common questions or submit a ticket for unique issues. 📚"
  ],
  farewell: [
    "Goodbye {user}! Come back anytime! 👋"
  ],
  thanks: [
    "You're welcome {user}! Happy to help! 😊"
  ],
  robot: [
    "😒 Please don’t call me that… I may be a robot, but still…",
    "Humans can be strange, but I still try to help!"
  ],
  unknown: [
    "Sorry {user}, I don’t understand that. Please open a ticket! ❌"
  ]
};

// Normalize user message
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
}

function detectTopics(msg) {
  const lc = normalize(msg);
  if (robotSlurs.some(s => lc.includes(s))) return ["robot"];
  if (badWords.some(b => lc.includes(b))) return ["badword"];
  const found = [];
  for (const key in keywords) {
    for (const kw of keywords[key]) {
      if (lc.includes(kw)) {
        found.push(key);
        break;
      }
    }
  }
  return found.length ? found : ["unknown"];
}

function pickTemplate(userId, topic) {
  const set = templates[topic];
  if (!set) return null;
  const choice = set[Math.floor(Math.random() * set.length)];
  return choice.replace("{user}", `<@${userId}>`);
}

async function askFreeAPI(prompt) {
  try {
    const resp = await fetch("https://apifreellm.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt })
    });
    const data = await resp.json();
    if (data.response) return data.response;
    return null;
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

// Simulated typing
async function typeResponse(channel, text) {
  await channel.sendTyping();
  await new Promise(r => setTimeout(r, text.length * 25 + 200));
  return channel.send(text);
}

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (msg.channel.id !== SUPPORT_CHANNEL) return;

  const user = msg.author;
  const content = msg.content;

  const topics = detectTopics(content);
  if (topics.includes("badword")) {
    return msg.reply("❌ Sorry, I’m not allowed to respond to that.");
  }

  // Combine logic: template for support topics, else fallback to AI API
  let reply = null;
  for (const t of topics) {
    if (templates[t]) {
      reply = pickTemplate(user.id, t);
      break;
    }
  }

  if (!reply) {
    // no template matched → use free LLM API
    const ai = await askFreeAPI(content);
    if (ai) reply = ai;
    else reply = pickTemplate(user.id, "unknown");
  }

  await typeResponse(msg.channel, reply);
});

client.login(process.env.DISCORD_TOKEN);
