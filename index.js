// index.js
const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');

// Discord bot token from environment variable (set this in Railway)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Channel to respond in
const TARGET_CHANNEL_ID = '1447354370420113610';

// Hugging Face model (free endpoint, no token required)
const HF_MODEL = 'gpt2';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return; // ignore bot messages
    if (message.channel.id !== TARGET_CHANNEL_ID) return; // only respond in target channel
    if (!message.content.startsWith('!ask ')) return; // only respond to "!ask " messages

    const userMessage = message.content.slice(5); // remove "!ask " prefix
    await message.channel.sendTyping();

    try {
        // Hugging Face API call
        const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: userMessage })
        });

        const data = await response.json();
        if (data.error) {
            message.reply(`AI Error: ${data.error}`);
        } else {
            const reply = Array.isArray(data) ? data[0].generated_text : data.generated_text;
            message.reply(reply || "I couldn't generate a response.");
        }

    } catch (err) {
        console.error(err);
        message.reply("Something went wrong while contacting the AI!");
    }
});

client.login(DISCORD_TOKEN);
