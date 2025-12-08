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

// Support channel
const SUPPORT_CHANNEL = "1447354370420113610";

// Robot slurs / bad words
const robotSlurs = ["clanker","wireback","tin can","metalhead","bot-brain"];
const badWords = ["fuck","shit","bitch","asshole","dumb","stupid"];

// Support keywords
const keywords = {
  greeting: ["hi","hello","hey","yo","hiya","sup","how are you","what's up"],
  ticket: ["ticket","support","help","assist","problem","issue","contact staff","open a ticket","how to open a ticket"],
  boost: ["boost","nitro","server boost","perks","boosting"],
  bug: ["bug","glitch","error","broken","crash","lag","freeze"],
  account: ["login","account","password","username","reset","profile"],
  roles: ["role","permissions","admin","moderator","member","rank"],
  faq: ["faq","questions","common","help topics","guide"],
  farewell: ["bye","goodbye","cya","later","farewell","see ya"],
  thanks: ["thanks","thank you","ty","thx","appreciate"]
};

// Response templates (single sentence per topic)
const templates = {
  greeting: [
    "Hello {user}! How are you today? 🌲",
    "Hi {user}! I hope your day is going well. 🌿",
    "Hey {user}! Need assistance? Tickets are open! ✨"
  ],
  ticket: [
    "Tickets are the fastest way to get help! 💬 Step-by-step: 1️⃣ Go to the support channel, 2️⃣ Click 'Create Ticket', 3️⃣ Describe your problem, 4️⃣ Our staff will respond ASAP. 📩"
  ],
  boost: [
    "Boosting the server unlocks perks for everyone! 💎 Just click the 'Boost' button in the server to help!"
  ],
  bug: [
    "Found a bug? Please open a ticket and provide details or screenshots. 🐛"
  ],
  account: [
    "Having trouble with your account? Open a ticket with your username or email and staff will assist. 🔐"
  ],
  roles: [
    "Need help with roles or permissions? Open a ticket and staff will adjust your roles safely. 🎫"
  ],
  faq: [
    "Check the FAQ for common questions, or open a ticket if your issue is unique. 📚"
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
    "Sorry {user}, I don’t understand that. Please open a ticket for support! ❌"
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

// Build single-response per topic
function buildResponse(user, topics) {
  const responses = [];
  for (const topic of topics) {
    if (templates[topic]) {
      const options = templates[topic];
      const sentence = options[Math.floor(Math.random() * options.length)];
      responses.push(sentence.replace("{user}", `<@${user.id}>`));
    }
  }

  // Founder / Co-founder special messages
  if (user.id === FOUNDER_ID) responses.push("(Also… founder detected. I’ll behave 😅)");
  if (user.id === COFOUNDER_ID) responses.push("(I wonder why the co-founder needs this… 🤔)");

  return responses;
}

// Typing simulation
async function typeSend(channel, responses) {
  for (const r of responses) {
    await channel.sendTyping();
    await new Promise(resolve => setTimeout(resolve, r.length * 20 + 300));
    await channel.send(r);
  }
}

// Handle messages
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  const user = message.author;
  const msg = message.content;

  const topics = detectTopics(msg);

  if (topics.includes("badword")) {
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  const responses = buildResponse(user, topics);
  await typeSend(message.channel, responses);
});

// Login
client.login(process.env.DISCORD_TOKEN);
