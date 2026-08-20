// Full ticket system: panel with category buttons -> private channel per ticket -> claim/close with transcript logging.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionsBitField, AttachmentBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const ticketsPath = path.join(__dirname, 'data', 'tickets.json');

function loadTickets() {
  try { return JSON.parse(fs.readFileSync(ticketsPath, 'utf8')); } catch { return {}; }
}
function saveTickets(data) {
  fs.writeFileSync(ticketsPath, JSON.stringify(data, null, 2));
}

const TICKET_TYPES = {
  complaint: { label: '🚩 Complaint', emoji: '🚩', style: ButtonStyle.Danger, prefix: 'complaint' },
  help: { label: '❓ Help / Support', emoji: '❓', style: ButtonStyle.Primary, prefix: 'help' },
  report: { label: '👤 Report a User', emoji: '👤', style: ButtonStyle.Secondary, prefix: 'report' },
};

const STAFF_ROLE_NAMES = ['🛡️ Admin', '🔨 Moderator', '👑 Founder'];

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 The T Clan Support')
    .setDescription(
      'Need help, want to file a complaint, or report a user? Click a button below to open a private ticket with staff.\n\n' +
      '🚩 **Complaint** — issue with a member, staff decision, or the server\n' +
      '❓ **Help / Support** — questions, technical issues, general help\n' +
      '👤 **Report a User** — report rule-breaking behavior'
    )
    .setColor(0x3498DB);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    Object.entries(TICKET_TYPES).map(([key, t]) =>
      new ButtonBuilder().setCustomId(`ticket_open_${key}`).setLabel(t.label).setStyle(t.style)
    )
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildSinglePanelEmbed(typeKey) {
  const type = TICKET_TYPES[typeKey];
  const descriptions = {
    complaint: 'Have an issue with a member, staff decision, or the server? Click below to open a private complaint ticket with staff.',
    help: 'Need help or have a question? Click below to open a private support ticket with staff.',
    report: 'Report rule-breaking behavior. Click below to open a private ticket with staff — include usernames, links, or screenshots if you have them.',
  };
  return new EmbedBuilder()
    .setTitle(`${type.label}`)
    .setDescription(descriptions[typeKey] || 'Click below to open a ticket.')
    .setColor(0x3498DB);
}

function buildSinglePanelRow(typeKey) {
  const type = TICKET_TYPES[typeKey];
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_open_${typeKey}`).setLabel(type.label).setStyle(type.style)
  );
}

async function postSinglePanel(channel, typeKey) {
  if (!TICKET_TYPES[typeKey]) throw new Error(`Unknown ticket type: ${typeKey}`);
  await channel.send({ embeds: [buildSinglePanelEmbed(typeKey)], components: [buildSinglePanelRow(typeKey)] });
}

// Maps existing Support-category channel names to the ticket type they should open.
const CHANNEL_TYPE_MAP = {
  'report-a-user': 'report',
  'complaints': 'complaint',
  'help-support': 'help',
};

function staffOverwrites(guild) {
  return STAFF_ROLE_NAMES
    .map(name => guild.roles.cache.find(r => r.name === name))
    .filter(Boolean)
    .map(role => ({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }));
}

async function openTicket(interaction, typeKey) {
  const type = TICKET_TYPES[typeKey];
  if (!type) return;

  const guild = interaction.guild;
  const tickets = loadTickets();

  // prevent duplicate open tickets of same type per user
  const existingId = tickets[`${interaction.user.id}_${typeKey}`];
  if (existingId) {
    const existingChannel = guild.channels.cache.get(existingId);
    if (existingChannel) {
      await interaction.reply({ content: `You already have an open ticket: <#${existingId}>`, ephemeral: true });
      return;
    }
  }

  await interaction.deferReply({ ephemeral: true });

  let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🎫 SUPPORT');
  if (!category) {
    category = await guild.channels.create({ name: '🎫 SUPPORT', type: ChannelType.GuildCategory });
  }

  const channelName = `${type.prefix}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Ticket type: ${type.label} | Opened by ${interaction.user.tag} (${interaction.user.id})`,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
      { id: guild.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
      ...staffOverwrites(guild),
    ],
  });

  tickets[`${interaction.user.id}_${typeKey}`] = channel.id;
  tickets[channel.id] = {
    userId: interaction.user.id,
    type: typeKey,
    claimedBy: null,
    openedAt: Date.now(),
  };
  saveTickets(tickets);

  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setEmoji('🙋').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
  );

  const introEmbed = new EmbedBuilder()
    .setTitle(`${type.label} Ticket`)
    .setDescription(
      `Hi ${interaction.user}, thanks for reaching out.\n\n` +
      `Please describe your issue in detail below. A staff member will claim this ticket shortly.\n\n` +
      `Staff: use **Claim** to take ownership, and **Close Ticket** when resolved (a transcript will be saved automatically).`
    )
    .setColor(0x3498DB)
    .setTimestamp();

  await channel.send({ content: `${interaction.user} | Staff notified.`, embeds: [introEmbed], components: [controlRow] });
  await interaction.editReply({ content: `✅ Ticket created: <#${channel.id}>` });
}

async function claimTicket(interaction) {
  const tickets = loadTickets();
  const record = tickets[interaction.channel.id];
  if (!record) {
    await interaction.reply({ content: 'This is not a valid ticket channel.', ephemeral: true });
    return;
  }
  if (record.claimedBy) {
    await interaction.reply({ content: `Already claimed by <@${record.claimedBy}>.`, ephemeral: true });
    return;
  }
  record.claimedBy = interaction.user.id;
  saveTickets(tickets);
  await interaction.reply({ content: `🙋 Ticket claimed by ${interaction.user}.` });
  await interaction.channel.setTopic(`${interaction.channel.topic} | Claimed by ${interaction.user.tag}`).catch(() => {});
}

async function closeTicket(interaction) {
  const guild = interaction.guild;
  const tickets = loadTickets();
  const record = tickets[interaction.channel.id];
  if (!record) {
    await interaction.reply({ content: 'This is not a valid ticket channel.', ephemeral: true });
    return;
  }

  await interaction.reply({ content: '🔒 Closing ticket and generating transcript in 5 seconds...' });

  // Build a simple text transcript of the channel
  const messages = await interaction.channel.messages.fetch({ limit: 100 });
  const sorted = [...messages.values()].reverse();
  const lines = sorted.map(m => {
    const time = new Date(m.createdTimestamp).toISOString();
    const content = m.content || '[embed/attachment]';
    return `[${time}] ${m.author.tag}: ${content}`;
  });
  const transcriptText = lines.join('\n') || 'No messages.';

  const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
  if (logChannel) {
    const attachment = new AttachmentBuilder(Buffer.from(transcriptText, 'utf8'), { name: `transcript-${interaction.channel.name}.txt` });
    const summary = new EmbedBuilder()
      .setTitle('🎫 Ticket Closed')
      .addFields(
        { name: 'Ticket', value: `#${interaction.channel.name}`, inline: true },
        { name: 'Opened by', value: `<@${record.userId}>`, inline: true },
        { name: 'Claimed by', value: record.claimedBy ? `<@${record.claimedBy}>` : 'Unclaimed', inline: true },
        { name: 'Closed by', value: `${interaction.user}`, inline: true },
      )
      .setColor(0xE74C3C)
      .setTimestamp();
    await logChannel.send({ embeds: [summary], files: [attachment] }).catch(() => {});
  }

  delete tickets[interaction.channel.id];
  delete tickets[`${record.userId}_${record.type}`];
  saveTickets(tickets);

  setTimeout(() => {
    interaction.channel.delete().catch(() => {});
  }, 5000);
}

async function handleTicketInteraction(interaction) {
  if (!interaction.isButton()) return false;
  const id = interaction.customId;

  if (id.startsWith('ticket_open_')) {
    const typeKey = id.replace('ticket_open_', '');
    await openTicket(interaction, typeKey);
    return true;
  }
  if (id === 'ticket_claim') {
    await claimTicket(interaction);
    return true;
  }
  if (id === 'ticket_close') {
    await closeTicket(interaction);
    return true;
  }
  return false;
}

module.exports = { postPanel, postSinglePanel, CHANNEL_TYPE_MAP, handleTicketInteraction };
