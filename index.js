import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ----------------------------------------------------
// MEMORY / BRAIN SYSTEM
// ----------------------------------------------------
const conversationMemory = {};
const brainMemory = {};

// ----------------------------------------------------
// BAD WORD FILTER
// ----------------------------------------------------
const badWords = [
  "swearword","idiot","stupid","dumb","bitch","shit","fuck","asshole","bastard",
  "jerk","sucks","loser","trash","crap","damn","hell","ugly","annoying","pain",
  "garbage","trash","moron","clown","weirdo","bozo"
];

// ----------------------------------------------------
// SUPPORT PHRASES (EXPANDED + SMARTER)
// ----------------------------------------------------
const supportPhrases = {
  ticket: [
    "Please open a support ticket so our team can properly assist you. 😊",
    "Submitting a ticket helps us solve your issue faster and more accurately.",
    "For best results, please create a ticket with all details included. 💬",
    "Tickets allow us to give you the most efficient support possible.",
    "Our staff responds quickest via ticket submissions. 📩",
    "A ticket ensures your issue gets tracked and handled correctly.",
    "Using a ticket keeps everything organized for faster help.",
    "Send us a ticket so the right team can solve your problem!",
    "Tickets let us look into your issue deeply and properly.",
    "Opening a ticket is the best way to get personalized help. 💡"
  ],

  boost: [
    "Boosting the server unlocks perks like emojis, quality audio, and more. ✨",
    "You can open a ticket if you need help boosting the server!",
    "Boosting improves features and helps the entire community. 💎",
    "Boost perks enhance the Forest Taggers experience for everyone!",
    "Server boosts enable upgraded audio and exclusive cosmetic perks.",
    "Want to boost but unsure how? A ticket can help! 🚀",
    "Boosting keeps the server running at its best!",
    "More boosts = more perks unlocked for the whole community.",
    "A boosted server gives smoother use and a better atmosphere! 🌟",
    "Boosting is an awesome way to support the server!"
  ],

  bug: [
    "If you found a bug, please include steps or screenshots in a ticket. 🐛",
    "Submitting a bug report via ticket helps us fix it ASAP!",
    "A detailed ticket helps us reproduce and fix the bug immediately.",
    "Screenshots or steps make bug fixing 10x faster. 📷",
    "Bug reported? Let us know via ticket so we can patch it!",
    "Bug support works best when submitted through tickets.",
    "Explain what happened right before the bug for better results.",
    "Ticketing bugs is the fastest way to get them resolved.",
    "We prioritize detailed bug tickets!",
    "Bug reports help keep Forest Taggers running smoothly!"
  ],

  greeting: [
    "Hello {user}! Welcome to Forest Taggers! 🌲",
    "Hey {user}! Need help? Tickets are always open! 😊",
    "Hi {user}! I’m here to assist with Forest Taggers support. 💚",
    "Greetings {user}! If something’s wrong, open a ticket anytime.",
    "Hey there {user}! How can I help today? ✨",
  ],

  farewell: [
    "Goodbye {user}! Come back anytime! 👋",
    "See you later {user}! Ticket support is always open. 🌙",
    "Farewell {user}! Hope you enjoyed your time here!",
    "Take care {user}! If you need help, just send a ticket. ✨",
  ],

  thanks: [
    "You're welcome {user}! Glad I could help. 😊",
    "Anytime {user}! If you need more support, open a ticket.",
    "No problem {user}! Happy to help!",
  ],

  founder: [
    "🌙 **Moon** is the founder of Forest Taggers — the creator, brain, and visionary!",
    "🐵 **Monkey401** is the co‑founder — helping operate and maintain everything behind the scenes.",
    "Moon leads Forest Taggers with passion and creativity!",
    "Monkey401 helps manage systems, support, and server features.",
  ],

  unknown: [
    "Sorry {user}, I only know about Forest Taggers support. Please open a ticket! ❌",
    "I can’t answer that {user} — open a ticket and our team will assist! ⚠️",
    "I only provide Forest Taggers‑related help {user}. You can open a ticket anytime.",
  ]
};

// ----------------------------------------------------
// KEYWORDS
// ----------------------------------------------------
const topicKeywords = {
  ticket: ["ticket","help","human assistance","support","problem","issue","fix","aid","assist","contact staff","need help","support team"],
  boost: ["boost","nitro","server boost","boosting","nitro help","boost perks","how to boost","boost guide"],
  bug: ["bug","error","glitch","crash","lag","broken","malfunction","freeze","bug report"],
  founder: ["who is moon","who is monkey401","who is monkey 401","founder","co-founder","owner"],
  greeting: ["hi","hello","hey","hiya","yo","sup","greetings","hey there"],
  farewell: ["bye","goodbye","see ya","cya","later","farewell","gtg"],
  thanks: ["thanks","thx","thank you","ty","appreciate","much thanks"],
};

// ----------------------------------------------------
// TOPIC DETECTION
// ----------------------------------------------------
function detectTopics(msg){
  const text = msg.content.toLowerCase();

  // New clanker override
  if (text.includes("clanker")) return ["clanker"];

  for(const b of badWords)
    if(text.includes(b)) return ["badword"];

  let detected=[];
  for(const key in topicKeywords){
    let score=0;
    topicKeywords[key].forEach(w=>{ if(text.includes(w)) score++; });
    if(score>0) detected.push({topic:key,score});
  }

  detected.sort((a,b)=>b.score-a.score);
  if(detected.length===0) return ["unknown"];
  return detected.map(d=>d.topic).slice(0,3);
}

// ----------------------------------------------------
// ADVANCED AI PARAGRAPH GENERATION
// ----------------------------------------------------
function generateParagraphs(user, topics){
  const paragraphs=[];
  const brain={topicsDetected: topics, phrasesChosen: [], reasoningScores: {}};

  topics.forEach(topic=>{
    const list = supportPhrases[topic] || supportPhrases.unknown;
    const chosen = list.sort(()=>0.5-Math.random()).slice(0,3);

    chosen.forEach(p=>{
      let rew = p.replace("{user}",user);
      paragraphs.push(rew);
      brain.phrasesChosen.push(rew);
    });

    brain.reasoningScores[topic]=Math.floor(Math.random()*100);
  });

  if(!conversationMemory[user]) conversationMemory[user]=[];
  const mem = conversationMemory[user];
  if(mem.length>0 && mem[mem.length-1]!==topics[0]){
    const ctx = `💡 Earlier you asked about **${mem[mem.length-1]}** — feel free to open a ticket for more info!`;
    paragraphs.push(ctx);
    brain.phrasesChosen.push(ctx);
  }

  mem.push(topics[0]);
  if(mem.length>15) mem.shift();

  brainMemory[user]=brain;
  return paragraphs;
}

// ----------------------------------------------------
// TYPING DELAY
// ----------------------------------------------------
async function typeSend(channel, paragraphs){
  for(const p of paragraphs){
    await channel.sendTyping();
    await new Promise(r=>setTimeout(r, p.length*40 + Math.random()*300));
    await channel.send(p);
  }
}

// ----------------------------------------------------
// MESSAGE HANDLER
// ----------------------------------------------------
client.on("messageCreate", async (message)=>{
  if(message.author.bot) return;
  if(message.channel.id !== process.env.SUPPORT_CHANNEL) return;

  const user = message.author.username;
  const text = message.content.toLowerCase();

  // .viewbrain command
  if(text.startsWith(".viewbrain")){
    const brain = brainMemory[user];
    if(!brain){
      await message.reply("🧠 I haven’t processed anything yet!");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🧠 AI Brain Diagnostics")
      .setColor(0x00FFA5)
      .addFields(
        {name:"Topics", value: brain.topicsDetected.join(", ")},
        {name:"Phrases", value: brain.phrasesChosen.join("\n")},
        {name:"Reasoning", value: Object.entries(brain.reasoningScores).map(([k,v])=>`${k}: ${v}%`).join("\n")},
        {name:"Memory", value: (conversationMemory[user]||[]).join(", ")}
      )
      .setTimestamp();

    await message.reply({embeds:[embed]});
    return;
  }

  // NEW: Clanker handler
  if(text.includes("clanker")){
    return message.reply("😒 Please don’t call me that… I may be a robot, but still… (this is why I hate humans)");
  }

  const topics = detectTopics(message);

  if(topics.includes("badword")){
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  const paragraphs = generateParagraphs(user, topics);
  await typeSend(message.channel, paragraphs);
});

client.login(process.env.DISCORD_TOKEN);
