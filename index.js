/**
 * index.js
 * Upgraded Smart Support Bot for Discord (English-only)
 *
 * - Single-file Node.js bot (CommonJS) using discord.js v14
 * - dotenv for token management
 * - Advanced intent detection with scoring (better English understanding)
 * - Synonym expansion, regex patterns, and fuzzy-ish scoring (no external ML)
 * - Per-user short-term context memory and context-aware replies
 * - Step-by-step instructions for tickets, ban appeals, boosting, bug reports, contact staff, rules, bans
 * - Paraphrasing/variation engine so replies don't repeat verbatim
 * - Bad-word and robot-slur filtering (polite refusal)
 * - Only replies once per user message
 *
 * Usage:
 * - Put DISCORD_TOKEN and optionally SUPPORT_CHANNEL in .env
 * - npm install discord.js dotenv
 * - node index.js
 */

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('ERROR: DISCORD_TOKEN missing from environment (.env).');
  process.exit(1);
}

// Configuration
const SUPPORT_CHANNEL = process.env.SUPPORT_CHANNEL || '1443121189445959836'; // default support channel id
const FOUNDER_ID = process.env.FOUNDER_ID || '1323241842975834166';
const COFOUNDER_ID = process.env.COFOUNDER_ID || '790777715652952074';
const PREFIX_MENTION = true; // reply mentions user
const MAX_CONTEXT_MESSAGES = 8; // per-user context memory
const TYPING_MIN_MS = 600;
const TYPING_MAX_MS = 1200;

// --- Lists (expand as you like) ---
const BAD_WORDS = [
  "fuck","shit","bitch","asshole","damn","crap","darn","bollocks","fucking","motherfucker","idiot","stupid"
];
const ROBOT_SLURS = ["clanker","wireback","tin can","metalhead","bot-brain","metal bucket"];

// helper: normalize text
function normalize(text){
  return String(text||'').toLowerCase()
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
    .replace(/[`~!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function wordsArray(text){ return normalize(text).split(' ').filter(Boolean); }
function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

// --- synonyms & expansions for more robust matching ---
const SYNONYMS = {
  ticket: ["ticket","support ticket","support","help ticket","issue","case"],
  appeal: ["appeal","appeal ban","ban appeal","appealing","appealed"],
  ban: ["ban","banned","suspended","suspension"],
  boost: ["boost","boosting","server boost","nitro","boosts"],
  bug: ["bug","glitch","error","crash","issue","problem","fault"],
  staff: ["staff","moderator","admin","support team","team"],
  rules: ["rules","server rules","policy","guidelines"],
  payment: ["payment","refund","purchase","charged","billing","receipt"],
  invite: ["invite","invitation","invite link"],
  account: ["account","profile","login","username","password"]
};

// --- Intents: keywords (phrases/words) and reply templates ---
const INTENTS = {
  greeting: {
    examples: ["hi","hello","hey","yo","good morning","good afternoon","good evening"],
    replies: [
      "Hi there! 👋 I'm the Forest Taggers support assistant — how can I help you today?",
      "Hello! 💚 Need help with something? Ask me and I'll guide you step-by-step.",
      "Hey! I'm here to help with support — tell me what's up and I'll assist."
    ]
  },

  ticket: {
    examples: ["open a ticket","create a ticket","how to open a ticket","new ticket","make a ticket","support ticket","open ticket","submit ticket"],
    replies: [
      "Tickets are the fastest way to get help. 💬 Step-by-step:\n1) Go to the Support area or click the 'Create Ticket' button.\n2) Choose the correct category (e.g. Ban Appeal, Bug Report).\n3) Describe your issue with details and screenshots.\n4) Submit the ticket and wait for staff to respond in the private ticket channel.",
      "To open a ticket: click 'Create Ticket' in the support section, pick the right category, explain the problem (include names, timestamps, and screenshots), then submit — staff will reply as soon as they can."
    ]
  },

  appeal_ban: {
    examples: ["appeal ban","ban appeal","how to appeal","appeal my ban","appeal a ban"],
    replies: [
      "To appeal a ban, please open a **Ban Appeal** ticket and include:\n1) Your Discord username and any in-game names or IDs.\n2) Date/time of the ban if known.\n3) A clear, calm explanation of what happened and any evidence (screenshots, context).\n4) Wait for staff to review the appeal — it may take time depending on queue.",
      "Ban appeals are handled via tickets. Open one, select 'Ban Appeal', give your username and context, and be respectful — staff will investigate and respond in the ticket."
    ]
  },

  boost: {
    examples: ["boost","server boost","how to boost","how do i boost","boosting"],
    replies: [
      "Boosting gives perks to the server! 🚀 To boost: click the server name at the top-left → Server Boost → choose how many boosts to apply and confirm using Discord Nitro.",
      "Want to boost? Click the Boost button on the server banner or go to Server Settings → Boosts. If you have payment issues, open a ticket with a receipt and we'll assist."
    ]
  },

  bug_report: {
    examples: ["bug","glitch","error","crash","report a bug","found a bug","game bug"],
    replies: [
      "Thanks for reporting a bug — please open a ticket and include:\n1) Steps to reproduce the bug.\n2) What you expected vs what happened.\n3) Screenshots or error messages.\n4) Platform (PC/Mobile) and app version. That helps staff investigate faster.",
      "Bug reports belong in tickets: describe the exact steps to reproduce, attach screenshots/logs, and staff will take it from there."
    ]
  },

  contact_staff: {
    examples: ["contact staff","talk to staff","get staff","reach staff","how to contact staff"],
    replies: [
      "The fastest way to contact staff is to open a support ticket. If it's urgent, politely mark it 'urgent' in the ticket and staff will prioritize when possible.",
      "Open a ticket in the Support section to reach staff — include details and someone will respond in the ticket channel."
    ]
  },

  rules: {
    examples: ["rules","server rules","what are the rules","where are the rules","read rules"],
    replies: [
      "Server rules are usually pinned in the #rules or #welcome channel — please read them. If you believe a rule was applied incorrectly to you, open a ticket to appeal.",
      "You can find the full set of rules in the rules channel. If something's unclear, open a ticket and staff will clarify."
    ]
  },

  bans: {
    examples: ["why was i banned","why am i banned","banned","ban reason"],
    replies: [
      "If you were banned, open a Ban Appeal ticket and include details (username, approximate time, and why you think it should be reviewed). Staff will check the logs and respond.",
      "Ban reasons are handled by staff in tickets — open a ticket and provide the context so the team can review your case."
    ]
  },

  payments: {
    examples: ["refund","payment","charged","billing","purchase","buy","receipt"],
    replies: [
      "Payment and refund issues are handled via tickets. Open a ticket, include the transaction receipt and a brief description of the issue, and staff will assist.",
      "If you were charged incorrectly, open a ticket with your payment info (do not post sensitive full card details) and staff will guide you through the refund process."
    ]
  },

  thanks: {
    examples: ["thanks","thank you","thx","ty","appreciate"],
    replies: [
      "You're welcome! 💚 Glad I could help — open a ticket if you need more assistance.",
      "Anytime! Let me know if there's anything else I can do."
    ]
  },

  farewell: {
    examples: ["bye","goodbye","see ya","later","cya"],
    replies: [
      "Goodbye! If you need more help later, open a support ticket. 👋",
      "See you later — take care! 😊"
    ]
  },

  unknown: {
    examples: [],
    replies: [
      "I’m sorry — I don’t have a direct answer for that. For support issues, please open a ticket describing the problem and staff will assist.",
      "I didn't quite understand. Try asking about tickets, ban appeals, boosting, or say 'help' and I'll guide you step-by-step."
    ]
  }
};

// Expand INTENTS: include synonyms from SYNONYMS map for better matches
for (const [key, syns] of Object.entries(SYNONYMS || {})) {
  for (const intentKey in INTENTS) {
    // if intent examples contain any of the synonym keywords already, skip
    if (INTENTS[intentKey].examples && INTENTS[intentKey].examples.some(e => syns.includes(e))) continue;
  }
}

// --- Advanced intent detection: scoring ---
function scoreIntent(messageNorm, intent){
  let score = 0;
  const msgWords = wordsArray(messageNorm);

  // direct phrase matches (higher weight)
  for (const phrase of intent.examples || []) {
    if (messageNorm.includes(phrase)) score += 5;
  }

  // word-level matches (lower weight)
  for (const phrase of intent.examples || []) {
    const tokens = wordsArray(phrase);
    for (const t of tokens) if (msgWords.includes(t)) score += 1;
  }

  // synonyms expansion: if any known synonym words appear, add small boost
  for (const synList of Object.values(SYNONYMS)) {
    for (const s of synList) {
      if (messageNorm.includes(s)) score += 0.5;
    }
  }

  // regex special case boosts (e.g., "how to", "steps", "appeal")
  if (/how to|how do i|steps|step by step|what is|what are/.test(messageNorm)) score += 1;

  return score;
}

function detectBestIntent(messageContent){
  const norm = normalize(messageContent);

  // quick checks
  if (BAD_WORDS.some(bw => norm.includes(bw))) return {intent:'bad_word'};
  if (ROBOT_SLURS.some(rs => norm.includes(rs))) return {intent:'robot_slur'};

  // score each intent
  let best = { key: 'unknown', score: 0 };
  for (const [key, info] of Object.entries(INTENTS)) {
    if (key === 'unknown') continue;
    const s = scoreIntent(norm, info);
    if (s > best.score) { best = { key, score: s }; }
  }

  // fallback token rules (if no best score)
  const words = wordsArray(norm);
  if (best.score < 1) {
    if (words.some(w => ['ticket','support','help','issue','problem','report'].includes(w))) return {intent:'ticket'};
    if (words.some(w => ['appeal','appealing','appealed'].includes(w))) return {intent:'appeal_ban'};
    if (words.some(w => ['boost','boosting','nitro'].includes(w))) return {intent:'boost'};
    if (words.some(w => ['bug','glitch','error','crash'].includes(w))) return {intent:'bug_report'};
    if (words.some(w => ['rule','rules','policy'].includes(w))) return {intent:'rules'};
  }

  return { intent: best.key || 'unknown' };
}

// --- Paraphrasing / variation engine ---
function varyText(template){
  // small variations: synonyms, punctuation, smileys
  const variants = [
    template,
    template.replace("To open a ticket:", "To start a ticket:"),
    template.replace("open a ticket", "create a ticket"),
    template.replace("open the Support", "visit the Support"),
    template + " 😊",
    template + " ✨",
    template.replace("Step-by-step:", "Here's how:"),
    template.replace("please", "kindly")
  ];
  return randomChoice(variants);
}

// --- Context memory ---
const context = new Map(); // userId -> array of messages
function pushContext(userId, text){
  if (!userId) return;
  const arr = context.get(userId) || [];
  arr.push({ text, ts: Date.now() });
  while (arr.length > MAX_CONTEXT_MESSAGES) arr.shift();
  context.set(userId, arr);
}
function getContextSummary(userId){
  const arr = context.get(userId) || [];
  if (!arr.length) return '';
  return arr.map(a => a.text).join(' | ');
}

// --- Bot setup ---
const client = new Client({
  intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ],
  partials: [ Partials.Channel ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} is online — Smart Support Bot ready.`);
});

// --- Main message handler ---
client.on('messageCreate', async (message) => {
  try {
    if (!message || !message.content) return;
    if (message.author?.bot) return;

    // Restrict to support channel if configured
    if (SUPPORT_CHANNEL && message.channel.id !== SUPPORT_CHANNEL) return;

    const userId = message.author.id;
    const raw = message.content.trim();
    if (!raw) return;

    pushContext(userId, raw);

    const norm = normalize(raw);

    // Bad word handling
    if (BAD_WORDS.some(bw => norm.includes(bw))) {
      await message.channel.sendTyping();
      await sleep(400 + Math.random()*600);
      return message.reply("❌ I won't respond to messages that use offensive language. Please be respectful and try again.");
    }

    // Robot slur handling
    if (ROBOT_SLURS.some(rs => norm.includes(rs))) {
      await message.channel.sendTyping();
      await sleep(400 + Math.random()*600);
      return message.reply("😒 Please don’t call me names. I'm here to help — let's keep it friendly.");
    }

    // Detect intent
    const { intent } = detectBestIntent(raw);

    // Compose reply
    let reply = "";
    // Special-case founder/cofounder: no annoying note, but if founder asks, maybe slightly different phrasing
    const isFounder = (userId === FOUNDER_ID);
    const isCofounder = (userId === COFOUNDER_ID);

    // Intent specific handling with detailed step-by-step where relevant
    switch (intent) {
      case 'ticket':
        reply = [
          `Hello ${message.author.toString()} — tickets are the fastest way to get support. 💬`,
          `Step-by-step to open a ticket:`,
          `1) Go to the **Support** channel or click the **Create Ticket** button if it's available.`,
          `2) Choose the correct category (e.g., Ban Appeal, Bug Report, Account Help).`,
          `3) Describe your issue clearly: what happened, when, and any relevant screenshots or IDs.`,
          `4) Submit the ticket. Staff will respond in the private ticket channel as soon as possible.`,
          `Tip: include usernames, timestamps, and screenshots to speed up resolution.`
        ].join('\n');
        break;

      case 'appeal_ban':
        reply = [
          `I can guide you through a ban appeal, ${message.author.toString()}. 🙏`,
          `How to appeal a ban (step-by-step):`,
          `1) Open a **Ban Appeal** ticket in Support.`,
          `2) Include your Discord username and any in-game names or IDs.`,
          `3) Describe the incident calmly and include evidence if available (screenshots, logs).`,
          `4) Wait for staff to review your appeal — it may take some time depending on queue.`,
          `Remember: respectful and factual appeals get better results.`
        ].join('\n');
        break;

      case 'boost':
        reply = [
          `${message.author.toString()} — boosting helps the community and unlocks perks! 🚀`,
          `How to boost:`,
          `1) Click the server name (top-left) or the **Boost** button on the server banner.`,
          `2) Select 'Server Boost' and follow the purchase flow using Discord Nitro.`,
          `3) Apply the boost to this server.`,
          `If you run into payment issues, open a ticket and include the transaction receipt.`
        ].join('\n');
        break;

      case 'bug_report':
        reply = [
          `Thanks for reporting this — here's how to submit a useful bug report:`,
          `1) Describe the exact steps to reproduce the issue.`,
          `2) Note what you expected vs what occurred.`,
          `3) Attach screenshots, logs, or full error messages if possible.`,
          `4) Open a Bug Report ticket and paste the information there — developers will investigate.`
        ].join('\n');
        break;

      case 'contact_staff':
        reply = [
          `To contact staff quickly, open a ticket in Support and describe your issue. Staff monitor tickets and will respond there.`,
          `If it's urgent, politely mention 'urgent' in the ticket — abuse of 'urgent' may delay handling.`
        ].join('\n');
        break;

      case 'rules':
        reply = [
          `Server rules are found in the #rules or #welcome channel. Please read them before posting. If you believe a rule was applied incorrectly, open a ticket to appeal.`,
          `If you want, I can summarize a rule for you — ask which rule you'd like explained.`
        ].join('\n');
        break;

      case 'bans':
        reply = [
          `If you've been banned, open a Ban Appeal ticket and include: your username, date/time (if known), and any context or evidence. Staff will check the moderation logs and reply in the ticket.`,
          `I can't unban directly, but I can guide you through filing an appeal.`
        ].join('\n');
        break;

      case 'payments':
        reply = [
          `Payment and refund issues are handled by support via tickets. Open a ticket and include your receipt or transaction ID (do not share full payment card numbers). Staff will assist with refunds or billing issues.`
        ].join('\n');
        break;

      case 'greeting':
      case 'how_are_you':
      case 'thanks':
      case 'farewell': {
        // use template replies from INTENTS
        const templates = INTENTS[intent].replies || INTENTS['unknown'].replies;
        reply = randomChoice(templates);
        break;
      }

      default:
        // Unknown intent: attempt contextual help or fallback
        {
          // If message looks like a question (how/what/why/where) and contains a support keyword, give targeted guidance
          if (/how|what|why|where|steps|instructions/.test(norm) && /ticket|appeal|boost|bug|ban|rules|staff/.test(norm)) {
            // pick closest helpful intent via small heuristics
            if (norm.includes('ticket') || norm.includes('support')) reply = INTENTS.ticket.replies[0];
            else if (norm.includes('appeal') || norm.includes('ban')) reply = INTENTS.appeal_ban.replies[0];
            else if (norm.includes('boost')||norm.includes('nitro')) reply = INTENTS.boost.replies[0];
            else if (norm.includes('bug')||norm.includes('error')) reply = INTENTS.bug_report.replies[0];
            else reply = INTENTS.unknown.replies[0];
          } else {
            // use a helpful fallback with suggestion to open ticket
            reply = INTENTS.unknown.replies[0];
          }

          // include a short context summary to make it feel "aware"
          const ctx = getContextSummary(userId);
          if (ctx && ctx.length > 0 && ctx.length < 300) {
            reply = `${reply}\n\n(Quick summary of what I saw from you: "${ctx}")`;
          }
        }
        break;
    }

    // small personalization for founder/cofounder (friendly, not annoying)
    if (isFounder) reply = reply.replace(/Hello|Hey|Hi there/gi, 'Hello, Founder —');
    if (isCofounder) reply = reply.replace(/Hello|Hey|Hi there/gi, 'Hello, Co-founder —');

    // ensure variation & paraphrase
    reply = varyText(reply);

    // typing simulation then reply once
    await message.channel.sendTyping();
    await sleep(TYPING_MIN_MS + Math.random()*(TYPING_MAX_MS - TYPING_MIN_MS));

    try {
      // reply() mentions user; use reply for clean UX
      await message.reply({ content: reply });
    } catch (err) {
      console.error('Failed to send reply:', err);
      // fallback: send to channel without reply
      try { await message.channel.send(`${message.author.toString()} ${reply}`); } catch(e){/* suppressed */ }
    }

  } catch (err) {
    console.error('Error handling message:', err);
  }
});

// graceful error logging
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

// login
client.login(TOKEN).then(() => {
  console.log('Bot login attempt finished.');
}).catch(err => {
  console.error('Bot failed to login. Check DISCORD_TOKEN and permissions:', err);
});
