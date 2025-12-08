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

// Support channel
const SUPPORT_CHANNEL = "1443121189445959836";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  const userMsg = message.content;
  const userId = message.author.id;

  // Typing simulation
  await message.channel.sendTyping();

  try {
    // Send message to Python AI server
    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMsg, user_id: userId }),
    });

    const data = await res.json();
    await message.channel.send(data.response);

  } catch (err) {
    console.error(err);
    await message.channel.send("❌ Sorry, something went wrong with the AI backend.");
  }
});

client.login(process.env.DISCORD_TOKEN);
