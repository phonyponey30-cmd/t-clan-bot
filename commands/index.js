const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { CONFIG, logAction } = require('../automod');

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
