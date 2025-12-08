import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { pipeline } from "@xenova/transformers";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// --------------------
// Memory & Brain
// --------------------
const brain = {};

// --------------------
// IDs
// --------------------
const FOUNDER_ID = "1323241842975834166";
const COFOUNDER_ID = "790777715652952074";

// --------------------
// Slurs / Bad Words
// --------------------
const robotSlurs = ["clanker","wireback","tin can","metalhead","bot-brain"];
const badWords = ["fuck","shit","bitch","asshole","dumb","stupid"];
const placeholders = ["PLACEHOLDER_1","PLACEHOLDER_2","PLACEHOLDER_3","PLACEHOLDER_4","PLACEHOLDER_5"];

// --------------------
// Support Keywords & Templates
// --------------------
const keywords = {
  greeting: ["hi","hello","hey","yo","hiya","sup","how are you","what's up"],
  ticket: ["ticket","support","help","assist","problem","issue","contact staff","open a ticket"],
  boost: ["boost","nitro","server boost","perks","boosting"],
  bug: ["bug","glitch","error","broken","crash","lag","freeze"],
  account: ["login","account","password","username","reset","profile"],
  roles: ["role","permissions","admin","moderator","member","rank"],
  faq: ["faq","questions","common","help topics","guide"],
  farewell: ["bye","goodbye","cya","later","farewell","see ya"],
  thanks: ["thanks","thank you","ty","thx","appreciate"]
};

const responses = {
  greeting: [
    "Hello {user}! How are you today? 🌲",
    "Hey {user}! I’m ready to assist with anything you need. 💚",
    "Hi {user}! Need help with Forest Taggers? Tickets are always open! ✨"
  ],
  ticket: [
    "Please open a support ticket so our staff can assist you quickly. 📩",
    "Tickets ensure your issue is addressed efficiently. 📝"
  ],
  boost: [
    "Boosting the server unlocks perks for everyone! 💎",
    "Boost perks benefit the entire community! 💚"
  ],
  bug: [
    "Found a bug? Open a ticket with details or screenshots. 🐛",
    "A clear bug report helps us fix it quickly. ⚡"
  ],
  account: [
    "Having trouble logging in? Open a ticket with your account info. 🔐",
    "Issues with password or username can be resolved via ticket. 📝"
  ],
  roles: [
    "Need help with roles or permissions? Submit a ticket for guidance. 🎫",
    "Tickets allow us to update your roles safely and quickly. 🛡️"
  ],
  faq: [
    "Check the FAQ for common questions or submit a ticket for anything unique. 📚",
    "Our FAQ helps with most support topics; tickets cover everything else."
  ],
  farewell: [
    "Goodbye {user}! Come back anytime! 👋",
    "See you later {user}! Ticket support is always open. 🌙"
  ],
  thanks: [
    "You're welcome {user}! Happy to help! 😊",
    "Anytime {user}! Need more support? Open a ticket."
  ],
  robot: [
    "😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)",
    "Really? You programmed me just to hear that?",
    "Ugh… humans… why am I even here? 😢",
    "PLACEHOLDER_1","PLACEHOLDER_2","PLACEHOLDER_3","PLACEHOLDER_4","PLACEHOLDER_5"
  ],
  unknown: [
    "Sorry {user}, I don’t understand that. Please open a ticket! ❌",
    "I’m not sure about that, {user}. Opening a ticket is the best option."
  ]
};

// --------------------
// Load local AI model
// --------------------
let generator;
(async () => {
  generator = await pipeline("text-generation", "gpt2");
  console.log("Local GPT-2 AI model loaded!");
})();

// --------------------
// Detect topics
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
// Build multi-topic multi-paragraph response
// --------------------
async function buildResponse(user, msg, topics) {
  const paragraphs = [];

  for (const topic of topics) {
    // Use templates for known support topics
    if (responses[topic]) {
      if (!brain[user.id]) brain[user.id] = {};
      if (!brain[user.id][topic]) brain[user.id][topic] = [];

      const available = responses[topic].filter(p => !brain[user.id][topic].includes(p));
      if (available.length === 0) brain[user.id][topic] = [];

      const chosen = available[Math.floor(Math.random() * available.length)];
      brain[user.id][topic].push(chosen);

      paragraphs.push(chosen.replace("{user}", `<@${user.id}>`));
    } 
    // Use GPT-2 for unknown or open-ended topics
    else if (generator) {
      try {
        const prompt = `${user.username}: ${msg}\nBot:`;
        const outputs = await generator(prompt, { max_new_tokens: 80, temperature: 0.8 });
        const aiText = outputs[0].generated_text.split("Bot:")[1]?.trim();
        if (aiText) paragraphs.push(aiText);
      } catch (e) {
        console.error("AI generation error:", e);
      }
    }
  }

  // Add subtle founder/co-founder notes
  if (user.id === FOUNDER_ID) paragraphs.push("(Also… founder detected. I’ll behave 😅)");
  if (user.id === COFOUNDER_ID) paragraphs.push("(I wonder why the co-founder needs this… 🤔)");

  return paragraphs;
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

  const paragraphs = await buildResponse(user, msg, topics);
  await typeSend(message.channel, paragraphs);
});

client.login(process.env.DISCORD_TOKEN);
