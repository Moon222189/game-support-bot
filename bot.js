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

const SUPPORT_CHANNEL = "1447354370420113610";

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  await message.channel.sendTyping();

  try {
    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message.content, user_id: message.author.id }),
    });
    const data = await res.json();
    await message.channel.send(data.response);
  } catch (err) {
    console.error(err);
    await message.channel.send("❌ Something went wrong with the AI backend.");
  }
});

client.login(process.env.DISCORD_TOKEN);
