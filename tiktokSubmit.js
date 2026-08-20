// "Submit your TikTok" system: a button in #post-your-tiktok opens a modal form
// where members paste their TikTok link, which gets posted as a clickable embed.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

const TIKTOK_URL_REGEX = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/.+/i;

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎬 Share Your TikTok')
    .setDescription('Click the button below and paste your TikTok video link — it\'ll be posted here instantly, linked straight to your video.')
    .setColor(0xFF0050);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('tiktok_submit_open').setLabel('Submit Your TikTok').setEmoji('🎬').setStyle(ButtonStyle.Success)
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildModal() {
  const modal = new ModalBuilder().setCustomId('tiktok_submit_modal').setTitle('Submit Your TikTok');

  const linkInput = new TextInputBuilder()
    .setCustomId('tiktok_link')
    .setLabel('TikTok video or profile link')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://www.tiktok.com/@yourhandle/video/...')
    .setRequired(true);

  const captionInput = new TextInputBuilder()
    .setCustomId('tiktok_caption')
    .setLabel('Caption (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(linkInput),
    new ActionRowBuilder().addComponents(captionInput),
  );
  return modal;
}

async function handleTikTokInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'tiktok_submit_open') {
    await interaction.showModal(buildModal());
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'tiktok_submit_modal') {
    const link = interaction.fields.getTextInputValue('tiktok_link').trim();
    const caption = interaction.fields.getTextInputValue('tiktok_caption')?.trim();

    if (!TIKTOK_URL_REGEX.test(link)) {
      await interaction.reply({ content: '⚠️ That doesn\'t look like a valid TikTok link. Please use a link like `https://www.tiktok.com/@yourhandle/video/...`.', ephemeral: true });
      return true;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setDescription(caption ? `${caption}\n\n🔗 [Watch on TikTok](${link})` : `🔗 [Watch on TikTok](${link})`)
      .setColor(0xFF0050)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: '✅ Your TikTok has been posted!', ephemeral: true });
    return true;
  }

  return false;
}

module.exports = { postPanel, handleTikTokInteraction };
