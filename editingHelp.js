// Editing help system: a button in #editing-help opens a modal form.
// The request posts publicly with a "Claim" button — anyone can claim it to help, right in the open channel.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('✂️ Need Editing Help?')
    .setDescription('Stuck on a transition, pacing, sound sync, or software issue? Post a request below — anyone in the clan can claim it and help you out right here.')
    .setColor(0x1ABC9C);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('editing_help_open').setLabel('Request Editing Help').setEmoji('✂️').setStyle(ButtonStyle.Primary)
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildModal() {
  const modal = new ModalBuilder().setCustomId('editing_help_modal').setTitle('Request Editing Help');

  const topicInput = new TextInputBuilder()
    .setCustomId('editing_topic')
    .setLabel('What do you need help with?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Syncing a jump cut to the beat')
    .setRequired(true);

  const detailsInput = new TextInputBuilder()
    .setCustomId('editing_details')
    .setLabel('Details')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('What software are you using? What have you tried? Links to clips help.')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(topicInput),
    new ActionRowBuilder().addComponents(detailsInput),
  );
  return modal;
}

async function handleEditingHelpInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'editing_help_open') {
    await interaction.showModal(buildModal());
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'editing_help_modal') {
    const topic = interaction.fields.getTextInputValue('editing_topic').trim();
    const details = interaction.fields.getTextInputValue('editing_details')?.trim();

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`✂️ ${topic}`)
      .setDescription(details || 'No extra details provided.')
      .setColor(0x1ABC9C)
      .setFooter({ text: 'Unclaimed — click below to help!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`editing_help_claim_${interaction.user.id}`).setLabel('Claim & Help').setEmoji('🙋').setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ content: `${interaction.user} needs editing help!`, embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Your help request has been posted!', ephemeral: true });
    return true;
  }

  if (interaction.isButton() && interaction.customId.startsWith('editing_help_claim_')) {
    const requesterId = interaction.customId.replace('editing_help_claim_', '');

    if (interaction.user.id === requesterId) {
      await interaction.reply({ content: 'You can\'t claim your own request.', ephemeral: true });
      return true;
    }

    if (interaction.message.components.length === 0) {
      await interaction.reply({ content: 'This request has already been claimed.', ephemeral: true });
      return true;
    }

    const claimedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ECC71)
      .setFooter({ text: `🙋 Claimed by ${interaction.user.tag}` });

    await interaction.update({ content: `<@${requesterId}> ${interaction.user} is here to help! 🎬`, embeds: [claimedEmbed], components: [] });
    return true;
  }

  return false;
}

module.exports = { postPanel, handleEditingHelpInteraction };
