// TikTok live notification system.
//
// TikTok has no official public API for third-party live-status notifications.
// This uses `tiktok-live-connector`, a widely-used open-source library that checks
// live status the same way TikTok's own web client does. It's unofficial, so it can
// occasionally break if TikTok changes something internally — if checks start
// silently failing for everyone, that library may need an update (`npm update
// tiktok-live-connector`) rather than anything in this file being broken.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const { TikTokLiveConnection } = require('tiktok-live-connector');
const fs = require('fs');
const path = require('path');

const registrationsPath = path.join(__dirname, 'data', 'liveRegistrations.json');
const statusPath = path.join(__dirname, 'data', 'liveStatus.json');

function loadJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

const CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between full sweeps
const DELAY_BETWEEN_CHECKS_MS = 4000; // stagger checks to avoid hammering TikTok

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🔴 TikTok Live Notifications')
    .setDescription(
      'Register your TikTok username to get pinged in this channel whenever you go live.\n\n' +
      '🔔 **Get Live Pings** — opt in to be notified whenever anyone in the clan goes live\n' +
      '📺 **Register Your TikTok** — link your TikTok username so the server can detect your live streams'
    )
    .setColor(0xE0245E);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('live_register_open').setLabel('Register Your TikTok').setEmoji('📺').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('live_ping_toggle').setLabel('Get Live Pings').setEmoji('🔔').setStyle(ButtonStyle.Secondary),
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildModal() {
  const modal = new ModalBuilder().setCustomId('live_register_modal').setTitle('Register Your TikTok');

  const usernameInput = new TextInputBuilder()
    .setCustomId('tiktok_username')
    .setLabel('Your TikTok username (no @, no link)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('yourhandle')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));
  return modal;
}

async function handleLiveInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'live_register_open') {
    await interaction.showModal(buildModal());
    return true;
  }

  if (interaction.isButton() && interaction.customId === 'live_ping_toggle') {
    const role = interaction.guild.roles.cache.find(r => r.name === '🔴 Live Ping');
    if (!role) {
      await interaction.reply({ content: 'Live Ping role not found — run npm run setup-server first.', ephemeral: true });
      return true;
    }
    const member = interaction.member;
    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      await interaction.reply({ content: '🔕 You will no longer get live pings.', ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: '🔔 You will now get pinged when someone goes live!', ephemeral: true });
    }
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'live_register_modal') {
    let username = interaction.fields.getTextInputValue('tiktok_username').trim();
    username = username.replace(/^@/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@/, '').split('/')[0];

    if (!/^[a-zA-Z0-9._]{2,24}$/.test(username)) {
      await interaction.reply({ content: '⚠️ That doesn\'t look like a valid TikTok username. Enter just the handle, e.g. `yourhandle`.', ephemeral: true });
      return true;
    }

    const registrations = loadJson(registrationsPath);
    registrations[interaction.user.id] = { username, discordTag: interaction.user.tag };
    saveJson(registrationsPath, registrations);

    await interaction.reply({ content: `✅ Registered **@${username}**. You'll be pinged here whenever you go live (usually within ${CHECK_INTERVAL_MS / 60000} minutes of starting).`, ephemeral: true });
    return true;
  }

  return false;
}

async function checkIsLive(username) {
  const connection = new TikTokLiveConnection(username, {});
  return connection.fetchIsLive();
}

async function pollLiveStatus(guild) {
  const registrations = loadJson(registrationsPath);
  const status = loadJson(statusPath);
  const liveChannel = guild.channels.cache.find(c => c.name === 'tiktok-live');
  const pingRole = guild.roles.cache.find(r => r.name === '🔴 Live Ping');

  for (const [discordUserId, reg] of Object.entries(registrations)) {
    const wasLive = !!status[discordUserId];
    let isLive = false;
    try {
      isLive = await checkIsLive(reg.username);
    } catch (err) {
      console.error(`Live check failed for @${reg.username}:`, err.message);
    }

    if (isLive && !wasLive && liveChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`🔴 @${reg.username} is LIVE on TikTok!`)
        .setDescription(`[Watch now](https://www.tiktok.com/@${reg.username}/live)`)
        .setColor(0xE0245E)
        .setTimestamp();
      await liveChannel.send({
        content: pingRole ? `${pingRole}` : undefined,
        embeds: [embed],
      }).catch(() => {});
    }

    status[discordUserId] = isLive;
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_CHECKS_MS));
  }

  saveJson(statusPath, status);
}

function startLivePolling(client) {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await pollLiveStatus(guild).catch(err => console.error('Live poll error:', err.message));
    }
  }, CHECK_INTERVAL_MS);
  console.log(`📺 TikTok live polling started (every ${CHECK_INTERVAL_MS / 60000} min).`);
}

module.exports = { postPanel, handleLiveInteraction, startLivePolling };
