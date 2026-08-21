const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { CONFIG, logAction } = require('../automod');
const { postPanel, postSinglePanel, CHANNEL_TYPE_MAP } = require('../tickets');
const { postPanel: postTikTokPanel } = require('../tiktokSubmit');
const { postPanel: postCollabPanel } = require('../collabRequests');
const { postResources } = require('../resourcesList');
const { postPanel: postWarningAppealPanel } = require('../warningAppeals');
const { postPanel: postSuggestionPanel } = require('../suggestions');
const { postPanel: postLivePanel } = require('../liveNotify');
const { postPanel: postEditingHelpPanel } = require('../editingHelp');
const { postToolsList } = require('../toolsAppsList');
const { postGrowthTips } = require('../growthTips');
const { getRank, initLeaderboard, MAX_LEVEL, buildRankEmbed, postRankCheckPanel } = require('../leveling');

const warningsPath = path.join(__dirname, '..', 'data', 'warnings.json');
function loadWarnings() {
  try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); } catch { return {}; }
}
function saveWarnings(data) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

const commands = [
  {
    data: new SlashCommandBuilder()
      .setName('setup-tickets')
      .setDescription('Post the ticket panel (Complaint / Help / Report) in this channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postPanel(interaction.channel);
      await interaction.reply({ content: 'Ticket panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-support-channels')
      .setDescription('Post dedicated ticket panels in #report-a-user, #complaints, and #help-support')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const guild = interaction.guild;
      const posted = [];
      const missing = [];
      for (const [channelName, typeKey] of Object.entries(CHANNEL_TYPE_MAP)) {
        const channel = guild.channels.cache.find(c => c.name === channelName);
        if (!channel) {
          missing.push(channelName);
          continue;
        }
        await postSinglePanel(channel, typeKey);
        posted.push(channelName);
      }
      const parts = [];
      if (posted.length) parts.push(`✅ Posted in: ${posted.map(n => `#${n}`).join(', ')}`);
      if (missing.length) parts.push(`⚠️ Channel(s) not found: ${missing.map(n => `#${n}`).join(', ')} — run npm run setup-server first.`);
      await interaction.reply({ content: parts.join('\n'), ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-tiktok-panel')
      .setDescription('Post the "Submit Your TikTok" button in this channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postTikTokPanel(interaction.channel);
      await interaction.reply({ content: 'TikTok submission panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-collab-panel')
      .setDescription('Post the "Request a Collab" button in this channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postCollabPanel(interaction.channel);
      await interaction.reply({ content: 'Collab request panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('post-resources')
      .setDescription('Post the curated creator resources & links list in this channel')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postResources(interaction.channel);
      await interaction.reply({ content: 'Resources list posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-warning-appeals')
      .setDescription('Post the "Appeal a Warning" button in this channel (#warning-appeals)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postWarningAppealPanel(interaction.channel);
      await interaction.reply({ content: 'Warning appeal panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-suggestions')
      .setDescription('Post the "Submit a Suggestion" button in this channel (#suggestions)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postSuggestionPanel(interaction.channel);
      await interaction.reply({ content: 'Suggestion panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-live-panel')
      .setDescription('Post the TikTok live registration panel in this channel (#tiktok-live)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postLivePanel(interaction.channel);
      await interaction.reply({ content: 'Live notification panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-editing-help')
      .setDescription('Post the "Request Editing Help" button in this channel (#editing-help)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postEditingHelpPanel(interaction.channel);
      await interaction.reply({ content: 'Editing help panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('post-tools-apps')
      .setDescription('Post the curated creator tools & apps list in this channel (#tools-and-apps)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postToolsList(interaction.channel);
      await interaction.reply({ content: 'Tools & apps list posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('post-growth-tips')
      .setDescription('Post the comprehensive growth tips list in this channel (#growth-tips)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postGrowthTips(interaction.channel);
      await interaction.reply({ content: 'Growth tips posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('rank')
      .setDescription('Check your (or another member\'s) level, XP, and leaderboard position')
      .addUserOption(o => o.setName('user').setDescription('User to check (defaults to you)').setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      const rank = getRank(user.id);
      if (!rank) {
        await interaction.reply({ content: `${user.id === interaction.user.id ? 'You haven\'t' : `${user.username} hasn't`} earned any XP yet — start chatting!`, ephemeral: true });
        return;
      }
      await interaction.reply({ embeds: [buildRankEmbed(user, rank)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-rank-panel')
      .setDescription('Post the "Check My Rank" button panel in this channel (#rank-check)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await postRankCheckPanel(interaction.channel);
      await interaction.reply({ content: 'Rank check panel posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-leaderboard')
      .setDescription('Post the self-updating leaderboard in this channel (#leaderboard)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      await initLeaderboard(interaction.channel);
      await interaction.reply({ content: 'Leaderboard posted — it will auto-refresh every 5 minutes.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('setup-verify')
      .setDescription('Post the verification message with a reaction gate in #verify')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Verify to unlock The T Clan')
        .setDescription('React with ✅ below to confirm you have read the rules and gain full access to the server.')
        .setColor(0x2ECC71);
      const msg = await interaction.channel.send({ embeds: [embed] });
      await msg.react('✅');
      await interaction.reply({ content: 'Verification message posted.', ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Manually warn a member')
      .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const warnings = loadWarnings();
      warnings[user.id] = (warnings[user.id] || 0) + 1;
      saveWarnings(warnings);
      await logAction(interaction.guild, {
        title: '⚠️ Manual Warning',
        description: `${user} warned by ${interaction.user}: ${reason} (Total: ${warnings[user.id]})`,
        color: 0xF1C40F,
      });
      await interaction.reply(`⚠️ ${user} has been warned. Total warnings: ${warnings[user.id]}`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('Check a member\'s warning count')
      .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const warnings = loadWarnings();
      await interaction.reply({ content: `${user} has ${warnings[user.id] || 0} warning(s).`, ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('clearwarnings')
      .setDescription('Reset a member\'s warning count')
      .addUserOption(o => o.setName('user').setDescription('User to reset').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const warnings = loadWarnings();
      delete warnings[user.id];
      saveWarnings(warnings);
      await interaction.reply(`✅ Warnings cleared for ${user}.`);
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('automod-dashboard')
      .setDescription('Show the current auto-mod configuration')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
      const embed = new EmbedBuilder()
        .setTitle('📊 Auto-Mod Dashboard')
        .setColor(0x3498DB)
        .addFields(
          { name: 'Mass mention limit', value: `${CONFIG.massMentionLimit} mentions`, inline: true },
          { name: 'Caps spam threshold', value: `${CONFIG.capsPercentThreshold * 100}%`, inline: true },
          { name: 'Duplicate spam threshold', value: `${CONFIG.duplicateThreshold} msgs / ${CONFIG.duplicateWindowMs / 1000}s`, inline: true },
          { name: 'Allowed link domains', value: CONFIG.allowedLinkDomains.join(', ') },
          { name: 'Blocked keywords', value: CONFIG.bannedKeywords.join(', ') },
          { name: 'Warn escalation', value: 'Warn → 1hr timeout → 24hr timeout → Kick → Ban' },
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Timeout a member')
      .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const minutes = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id);
      await member.timeout(minutes * 60 * 1000, reason);
      await logAction(interaction.guild, {
        title: '🔇 Member Muted',
        description: `${user} muted for ${minutes} min by ${interaction.user}: ${reason}`,
        color: 0xE67E22,
      });
      await interaction.reply(`🔇 ${user} has been muted for ${minutes} minutes.`);
    },
  },
];

module.exports = commands;
