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

const SUPPORT_CHANNEL = "1443121189445959836";

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (message.channel.id !== SUPPORT_CHANNEL) return;

  const userMsg = message.content;

  // Call Python AI server
  try {
    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMsg })
    });
    const data = await res.json();
    await message.channel.send(data.response);
  } catch (err) {
    console.log(err);
    await message.channel.send("❌ Sorry, something went wrong with AI.");
  }
});

client.login(process.env.DISCORD_TOKEN);
