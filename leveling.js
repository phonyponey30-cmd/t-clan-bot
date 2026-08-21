// XP/leveling system. Members earn XP from chatting (with a cooldown to prevent spam-farming),
// level up over time, and reaching level 1000 automatically grants the ⭐ VIP role.
// The leaderboard channel self-updates by editing one pinned embed every 5 minutes.

const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, 'data', 'levels.json');
const leaderboardStatePath = path.join(__dirname, 'data', 'leaderboardState.json');

function loadJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

const XP_MIN = 15;
const XP_MAX = 25;
const COOLDOWN_MS = 60 * 1000;
const MAX_LEVEL = 1000;
const LEADERBOARD_UPDATE_MS = 5 * 60 * 1000;
const LEADERBOARD_SIZE = 10;

const cooldowns = new Map(); // userId -> last XP timestamp (in-memory; resets on restart, which just means one free message)

// Cumulative XP required to REACH a given level, starting from 0 at level 0.
// L^2 + 21L curve: early levels come quickly, level 1000 needs ~1M XP — reachable
// by a very active daily chatter in roughly a year to a year and a half, a genuine
// long-term milestone rather than something either instant or practically impossible.
function totalXpForLevel(level) {
  return level * level + 21 * level;
}

function levelFromXp(xp) {
  // Solve L^2 + 21L - xp = 0 for L, then floor to the exact level boundary.
  const level = Math.floor((-21 + Math.sqrt(441 + 4 * xp)) / 2);
  return Math.max(0, Math.min(MAX_LEVEL, level));
}

function xpProgress(xp) {
  const level = levelFromXp(xp);
  const currentFloor = totalXpForLevel(level);
  const nextFloor = totalXpForLevel(level + 1);
  return { level, currentFloor, nextFloor, xpIntoLevel: xp - currentFloor, xpNeededForLevel: nextFloor - currentFloor };
}

async function grantVipIfMaxLevel(member, level) {
  if (level < MAX_LEVEL) return false;
  const vipRole = member.guild.roles.cache.find(r => r.name === '⭐ VIP');
  if (!vipRole || member.roles.cache.has(vipRole.id)) return false;
  await member.roles.add(vipRole).catch(() => {});
  return true;
}

async function handleMessageXp(message) {
  if (message.author.bot || !message.guild) return;

  const now = Date.now();
  const last = cooldowns.get(message.author.id) || 0;
  if (now - last < COOLDOWN_MS) return;
  cooldowns.set(message.author.id, now);

  const levels = loadJson(levelsPath);
  const record = levels[message.author.id] || { xp: 0 };
  const beforeLevel = levelFromXp(record.xp);

  record.xp += Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
  const afterLevel = levelFromXp(record.xp);
  levels[message.author.id] = record;
  saveJson(levelsPath, levels);

  if (afterLevel > beforeLevel) {
    message.channel.send(`🎉 ${message.author} leveled up to **Level ${afterLevel}**!`).catch(() => {});
    const gotVip = await grantVipIfMaxLevel(message.member, afterLevel);
    if (gotVip) {
      message.channel.send(`👑 ${message.author} just hit **Level ${MAX_LEVEL}** and earned the **⭐ VIP** role!`).catch(() => {});
    }
  }
}

function getRank(userId) {
  const levels = loadJson(levelsPath);
  const record = levels[userId];
  if (!record) return null;

  const sorted = Object.entries(levels).sort((a, b) => b[1].xp - a[1].xp);
  const position = sorted.findIndex(([id]) => id === userId) + 1;

  return { ...xpProgress(record.xp), xp: record.xp, position, total: sorted.length };
}

function buildLeaderboardEmbed(guild) {
  const levels = loadJson(levelsPath);
  const sorted = Object.entries(levels).sort((a, b) => b[1].xp - a[1].xp).slice(0, LEADERBOARD_SIZE);

  const medals = ['🥇', '🥈', '🥉'];
  const lines = sorted.map(([userId, record], i) => {
    const { level } = xpProgress(record.xp);
    const rank = medals[i] || `#${i + 1}`;
    const member = guild.members.cache.get(userId);
    const name = member ? member.user.tag : `Unknown User (${userId})`;
    return `${rank} **${name}** — Level ${level} (${record.xp.toLocaleString()} XP)`;
  });

  return new EmbedBuilder()
    .setTitle('🏆 The T Clan Leaderboard')
    .setDescription(lines.length ? lines.join('\n') : 'No activity yet — start chatting to earn XP!')
    .setColor(0xFFD700)
    .setFooter({ text: `Updates every ${LEADERBOARD_UPDATE_MS / 60000} minutes • Reach Level ${MAX_LEVEL} for VIP` })
    .setTimestamp();
}

async function refreshLeaderboard(guild) {
  const state = loadJson(leaderboardStatePath);
  if (!state.channelId || !state.messageId) return;

  const channel = guild.channels.cache.get(state.channelId);
  if (!channel) return;

  await guild.members.fetch().catch(() => {}); // ensure member cache is populated for tag lookups

  const message = await channel.messages.fetch(state.messageId).catch(() => null);
  if (!message) return;

  await message.edit({ embeds: [buildLeaderboardEmbed(guild)] }).catch(() => {});
}

async function initLeaderboard(channel) {
  const embed = buildLeaderboardEmbed(channel.guild);
  const message = await channel.send({ embeds: [embed] });
  saveJson(leaderboardStatePath, { channelId: channel.id, messageId: message.id });
  return message;
}

function startLeaderboardUpdater(client) {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await refreshLeaderboard(guild).catch(err => console.error('Leaderboard refresh error:', err.message));
    }
  }, LEADERBOARD_UPDATE_MS);
  console.log(`🏆 Leaderboard auto-refresh started (every ${LEADERBOARD_UPDATE_MS / 60000} min).`);
}

module.exports = {
  handleMessageXp, getRank, buildLeaderboardEmbed, initLeaderboard,
  startLeaderboardUpdater, MAX_LEVEL, xpProgress,
};
