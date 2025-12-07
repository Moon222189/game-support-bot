import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on("ready", () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
});

// FAQ LIST — YOU CAN EDIT THIS ANYTIME
const faq = [
    {
        keywords: ["coins", "money", "gold"],
        answer: "💰 You can earn coins by completing quests and events."
    },
    {
        keywords: ["help", "support", "admin"],
        answer: "📨 Need support? Open a ticket or ping a moderator!"
    },
    {
        keywords: ["xp", "level up", "experience"],
        answer: "⚡ You earn XP from completing missions and defeating enemies."
    },
    {
        keywords: ["boss", "raid"],
        answer: "🐉 Boss raids spawn every 3 hours. Check the events channel!"
    }
];

// MATCH KEYWORDS → RETURN ANSWER
function getAnswer(message) {
    const text = message.toLowerCase();

    for (const entry of faq) {
        for (const keyword of entry.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                return entry.answer;
            }
        }
    }

    return null;
}

client.on("messageCreate", (message) => {
    if (message.author.bot) return;

    // only respond in your support channel
    if (message.channel.id !== process.env.TARGET_CHANNEL) return;

    const answer = getAnswer(message.content);

    if (answer) message.reply(answer);
});

client.login(process.env.DISCORD_TOKEN);
