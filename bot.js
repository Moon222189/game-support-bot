import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
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

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  const userMsg = message.content.toLowerCase();

  // Bad word filter
  if (badWords.some(w => userMsg.includes(w))) {
    return message.reply("❌ Sorry, Moon didn’t program me to listen to swearwords!");
  }

  // Robot slur filter
  if (robotSlurs.some(s => userMsg.includes(s))) {
    return message.reply("😒 Please don’t call me that… I may be a robot, but still… (ugh… humans.)");
  }

  // Typing simulation
  await message.channel.sendTyping();

  // Call Python AI backend
  try {
    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMsg })
    });
    const data = await res.json();

    // Add founder/co-founder notes
    let reply = data.response;
    if (message.author.id === FOUNDER_ID) reply += "\n(Also… founder detected. I’ll behave 😅)";
    if (message.author.id === COFOUNDER_ID) reply += "\n(I wonder why the co-founder needs this… 🤔)";

    await message.channel.send(reply);
  } catch (err) {
    console.error(err);
    await message.channel.send("❌ Sorry, something went wrong with the AI backend.");
  }
});

client.login(process.env.DISCORD_TOKEN);
