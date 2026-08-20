// Lightweight in-bot auto-moderation (works alongside Discord's native AutoMod).
// Handles: invite links, mass mentions, excessive caps, link whitelist, duplicate/spam messages.
// Every action is logged to #mod-logs and #automod-dashboard, and escalates warnings.

const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const warningsPath = path.join(__dirname, 'data', 'warnings.json');

const CONFIG = {
  massMentionLimit: 5,
  capsPercentThreshold: 0.7,
  capsMinLength: 12,
  duplicateWindowMs: 5000,
  duplicateThreshold: 4,
  allowedLinkDomains: ['tiktok.com', 'vm.tiktok.com', 'discord.gg', 'discord.com', 'tenor.com', 'giphy.com'],
  bannedKeywords: ['free nitro', 'steam gift', 'crypto giveaway', 'nitro-gift', 'discord.gift', 'airdrop claim'],
  inviteRegex: /(discord\.gg\/|discordapp\.com\/invite\/|discord\.com\/invite\/)/i,
  linkRegex: /(https?:\/\/[^\s]+)/gi,
};

const recentMessages = new Map(); // userId -> [{content, time}]

function loadWarnings() {
  try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); } catch { return {}; }
}
function saveWarnings(data) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

async function logAction(guild, { title, description, color = 0xE74C3C, member }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();
  if (member) embed.setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() });

  const modLogs = guild.channels.cache.find(c => c.name === 'mod-logs');
  const dashboard = guild.channels.cache.find(c => c.name === 'automod-dashboard');
  if (modLogs) await modLogs.send({ embeds: [embed] }).catch(() => {});
  if (dashboard) await dashboard.send({ embeds: [embed] }).catch(() => {});
}

async function escalate(member, reason, guild) {
  const warnings = loadWarnings();
  const uid = member.id;
  warnings[uid] = (warnings[uid] || 0) + 1;
  saveWarnings(warnings);
  const count = warnings[uid];

  let actionDesc = `Warning ${count} for ${member}: ${reason}`;
  try {
    if (count === 1) {
      // just warn
    } else if (count === 2) {
      await member.timeout(60 * 60 * 1000, reason); // 1 hour
      actionDesc += ' → **1 hour timeout**';
    } else if (count === 3) {
      await member.timeout(24 * 60 * 60 * 1000, reason); // 24 hours
      actionDesc += ' → **24 hour timeout**';
    } else if (count === 4) {
      await member.kick(reason);
      actionDesc += ' → **Kicked**';
    } else {
      await member.ban({ reason });
      actionDesc += ' → **Banned**';
    }
  } catch (err) {
    actionDesc += ` (action failed: ${err.message})`;
  }

  await logAction(guild, {
    title: '🚨 Auto-Mod Action',
    description: actionDesc,
    member,
  });
}

function isStaff(member) {
  return member.roles.cache.some(r => ['🛡️ Admin', '🔨 Moderator', '👑 Founder'].includes(r.name));
}

async function handleMessage(message) {
  if (message.author.bot || !message.guild) return;
  if (isStaff(message.member)) return;

  const content = message.content;
  const lower = content.toLowerCase();

  // 1. Banned keywords / scam terms
  for (const kw of CONFIG.bannedKeywords) {
    if (lower.includes(kw)) {
      await message.delete().catch(() => {});
      await escalate(message.member, `Blocked keyword: "${kw}"`, message.guild);
      return;
    }
  }

  // 2. Discord invite links (non-staff)
  if (CONFIG.inviteRegex.test(content) && !content.includes('discord.gg/KG4b6n8ZdC')) {
    await message.delete().catch(() => {});
    await escalate(message.member, 'Posted an unauthorized Discord invite link', message.guild);
    return;
  }

  // 3. Link whitelist enforcement
  const links = content.match(CONFIG.linkRegex);
  if (links) {
    for (const link of links) {
      const allowed = CONFIG.allowedLinkDomains.some(domain => link.includes(domain));
      if (!allowed) {
        await message.delete().catch(() => {});
        await escalate(message.member, `Posted a non-whitelisted link: ${link}`, message.guild);
        return;
      }
    }
  }

  // 4. Mass mentions
  if (message.mentions.users.size + message.mentions.roles.size > CONFIG.massMentionLimit) {
    await message.delete().catch(() => {});
    await escalate(message.member, 'Mass mention spam', message.guild);
    return;
  }

  // 5. Excessive caps
  if (content.length >= CONFIG.capsMinLength) {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0) {
      const caps = letters.replace(/[^A-Z]/g, '').length;
      if (caps / letters.length >= CONFIG.capsPercentThreshold) {
        await message.delete().catch(() => {});
        await escalate(message.member, 'Excessive caps spam', message.guild);
        return;
      }
    }
  }

  // 6. Duplicate/rapid spam
  const uid = message.author.id;
  const now = Date.now();
  const recent = (recentMessages.get(uid) || []).filter(m => now - m.time < CONFIG.duplicateWindowMs);
  recent.push({ content, time: now });
  recentMessages.set(uid, recent);

  const duplicates = recent.filter(m => m.content === content).length;
  if (duplicates >= CONFIG.duplicateThreshold) {
    await message.delete().catch(() => {});
    await escalate(message.member, 'Duplicate message spam', message.guild);
    recentMessages.set(uid, []);
    return;
  }
}

module.exports = { handleMessage, logAction, CONFIG };
