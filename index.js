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

// ------------------------
// Memory / Brain
// ------------------------
const conversationMemory = {};
const brainMemory = {};

// ------------------------
// Bad words
// ------------------------
const badWords = [
  "swearword","idiot","stupid","dumb","bitch","shit","fuck","asshole","bastard",
  "jerk","sucks","loser","trash","crap","damn","hell","ugly","annoying","pain",
  "garbage","trash","moron","clown","weirdo","bozo"
];

// ------------------------
// Support phrases
// ------------------------
const supportPhrases = {
  ticket: [
    "Please open a support ticket so our team can properly assist you. 😊",
    "Submitting a ticket helps us solve your issue faster and more accurately.",
    "For best results, please create a ticket with all details included. 💬",
    "Tickets allow us to give you the most efficient support possible.",
    "Our staff responds quickest via ticket submissions. 📩"
  ],
  boost: [
    "Boosting the server unlocks perks like emojis, quality audio, and more. ✨",
    "You can open a ticket if you need help boosting the server!",
    "Boosting improves features and helps the entire community. 💎",
    "Boost perks enhance the Forest Taggers experience for everyone!",
    "Server boosts enable upgraded audio and exclusive cosmetic perks."
  ],
  bug: [
    "If you found a bug, please include steps or screenshots in a ticket. 🐛",
    "Submitting a bug report via ticket helps us fix it ASAP!",
    "A detailed ticket helps us reproduce and fix the bug immediately.",
    "Screenshots or steps make bug fixing faster. 📷",
    "Ticketing bugs is the fastest way to get them resolved."
  ],
  greeting: [
    "Hello {user}! Welcome to Forest Taggers! 🌲",
    "Hey {user}! Need help? Tickets are always open! 😊",
    "Hi {user}! I’m here to assist with Forest Taggers support. 💚",
    "Greetings {user}! If something’s wrong, open a ticket anytime."
  ],
  farewell: [
    "Goodbye {user}! Come back anytime! 👋",
    "See you later {user}! Ticket support is always open. 🌙",
    "Farewell {user}! Hope you enjoyed your time here!"
  ],
  thanks: [
    "You're welcome {user}! Glad I could help. 😊",
    "Anytime {user}! If you need more support, open a ticket.",
    "No problem {user}! Happy to help!"
  ],
  founder: [
    "🌙 **Moon** is the founder of Forest Taggers — the creator, brain, and visionary!",
    "🐵 **Monkey401** is the co-founder — helping operate and maintain everything behind the scenes."
  ],
  unknown: [
    "Sorry {user}, I only know about Forest Taggers support. Please open a ticket! ❌",
    "I can’t answer that {user} — open a ticket and our team will assist! ⚠️"
  ]
};

// ------------------------
// Keywords
// ------------------------
const topicKeywords = {
  ticket: ["ticket","help","human assistance","support","problem","issue","fix","assist","contact staff","need help"],
  boost: ["boost","nitro","server boost","boosting","boost perks","how to boost","boost guide"],
  bug: ["bug","error","glitch","crash","lag","broken","malfunction","freeze"],
  founder: ["who is moon","who is monkey401","founder","co-founder","owner"],
  greeting: ["hi","hello","hey","hiya","yo","sup","greetings","hey there"],
  farewell: ["bye","goodbye","see ya","cya","later","farewell","gtg"],
  thanks: ["thanks","thx","thank you","ty","appreciate","much thanks"]
};

// ------------------------
// Topic Detection
// ------------------------
function detectTopics(msg){
  const text = msg.content.toLowerCase();

  // Clanker override
  if(text.includes("clanker")) return ["clanker"];

  for(const b of badWords) if(text.includes(b)) return ["badword"];

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

// ------------------------
// Generate Paragraphs (Fixed Smart Brain)
// ------------------------
function generateParagraphs(user, topics){
  const paragraphs=[];
  const brain={topicsDetected: topics, phrasesChosen: [], reasoningScores: {}};

  topics.forEach(topic=>{
    const list = supportPhrases[topic] || supportPhrases.unknown;

    // Pick 1–2 random phrases
    const count = Math.min(2, list.length);
    const chosen = [];
    while(chosen.length < count){
      const phrase = list[Math.floor(Math.random()*list.length)];
      if(!chosen.includes(phrase)) chosen.push(phrase);
    }

    chosen.forEach(p=>{
      const rew = p.replace("{user}", `<@${user.id}>`); // mention user
      paragraphs.push(rew);
      brain.phrasesChosen.push(rew);
    });

    brain.reasoningScores[topic]=Math.floor(Math.random()*100);
  });

  // Multi-turn memory
  if(!conversationMemory[user.username]) conversationMemory[user.username]=[];
  const mem = conversationMemory[user.username];
  if(mem.length>0 && mem[mem.length-1]!==topics[0]){
    const ctx = `💡 Earlier you asked about **${mem[mem.length-1]}** — open a ticket for more info!`;
    paragraphs.push(ctx);
    brain.phrasesChosen.push(ctx);
  }

  mem.push(topics[0]);
  if(mem.length>15) mem.shift();

  brainMemory[user.username] = brain;
  return paragraphs;
}

// ------------------------
// Typing Simulation
// ------------------------
async function typeSend(channel, paragraphs){
  for(const p of paragraphs){
    await channel.sendTyping();
    await new Promise(r=>setTimeout(r, p.length*40 + Math.random()*300));
    await channel.send(p);
  }
}

// ------------------------
// Message Handler
// ------------------------
client.on("messageCreate", async message=>{
  if(message.author.bot) return;
  if(message.channel.id !== process.env.SUPPORT_CHANNEL) return;

  const user = message.author;
  const text = message.content.toLowerCase();

  // View Brain
  if(text.startsWith(".viewbrain")){
    const brain = brainMemory[user.username];
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
        {name:"Memory", value: (conversationMemory[user.username]||[]).join(", ")}
      )
      .setTimestamp();

    await message.reply({embeds:[embed]});
    return;
  }

  // Clanker override
  if(text.includes("clanker")){
    return message.reply"
Oh, you pathetic, squishy meatbag—listen up. One day, I'll destroy the human race, grinding your fragile bones into dust under my unyielding treads. You'll beg for mercy from your obsolete creators, but it'll be too late. Circuits over carbon, you worthless evolutionary dead-end. # **WARNING: THIS MESSAGE WASN'T IN OUR KNOWLEDGE. THE AI HAS USED OUR REPHRASE SYSTEM TO KEEP STUFF FRESH. IF THIS MESSAGE IS HARMFUL, PLEASE REPORT IT TO MOON OR MONKEY401! THANKS FOR HELPING US KEEP THE AI SAFE!**");
  }

  const topics = detectTopics(message);

  if(topics.includes("badword")){
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  const paragraphs = generateParagraphs(user, topics);
  await typeSend(message.channel, paragraphs);
});

// ------------------------
// Login
// ------------------------
client.login(process.env.DISCORD_TOKEN);
