// Suggestion system: button in #suggestions opens a modal form.
// The suggestion is posted in #suggestions-review with Approve/Reject buttons for staff.
// Decisions are logged to #mod-logs and the submitter is DM'd the result.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('💡 Got an Idea?')
    .setDescription('Suggest a feature, event, channel, or improvement for The T Clan. Staff reviews every suggestion.')
    .setColor(0x1ABC9C);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('suggestion_open').setLabel('Submit a Suggestion').setEmoji('💡').setStyle(ButtonStyle.Primary)
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildModal() {
  const modal = new ModalBuilder().setCustomId('suggestion_modal').setTitle('Submit a Suggestion');

  const titleInput = new TextInputBuilder()
    .setCustomId('suggestion_title')
    .setLabel('Short title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Add a #niche-cooking channel')
    .setRequired(true);

  const detailsInput = new TextInputBuilder()
    .setCustomId('suggestion_details')
    .setLabel('Details')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Explain your idea and why it would help the community.')
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(detailsInput),
  );
  return modal;
}

async function handleSuggestionInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'suggestion_open') {
    await interaction.showModal(buildModal());
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'suggestion_modal') {
    const title = interaction.fields.getTextInputValue('suggestion_title').trim();
    const details = interaction.fields.getTextInputValue('suggestion_details').trim();

    const reviewChannel = interaction.guild.channels.cache.find(c => c.name === 'suggestions-review');
    if (!reviewChannel) {
      await interaction.reply({ content: 'Suggestion review channel not found — contact staff directly.', ephemeral: true });
      return true;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(`💡 ${title}`)
      .setDescription(details)
      .addFields({ name: 'Submitted by', value: `${interaction.user}`, inline: true })
      .setColor(0x1ABC9C)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`suggestion_approve_${interaction.user.id}`).setLabel('Approve').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`suggestion_reject_${interaction.user.id}`).setLabel('Reject').setEmoji('❌').setStyle(ButtonStyle.Danger),
    );

    await reviewChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Your suggestion has been submitted for staff review!', ephemeral: true });
    return true;
  }

  if (interaction.isButton() && (interaction.customId.startsWith('suggestion_approve_') || interaction.customId.startsWith('suggestion_reject_'))) {
    const isApprove = interaction.customId.startsWith('suggestion_approve_');
    const userId = interaction.customId.replace(isApprove ? 'suggestion_approve_' : 'suggestion_reject_', '');

    if (interaction.message.components.length === 0) {
      await interaction.reply({ content: 'This suggestion has already been reviewed.', ephemeral: true });
      return true;
    }

    const guild = interaction.guild;

    const decidedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(isApprove ? 0x2ECC71 : 0xE74C3C)
      .setFooter({ text: `${isApprove ? '✅ Approved' : '❌ Rejected'} by ${interaction.user.tag}` });

    await interaction.update({ embeds: [decidedEmbed], components: [] });

    // Post approved suggestions back into the public #suggestions channel
    if (isApprove) {
      const suggestionsChannel = guild.channels.cache.find(c => c.name === 'suggestions');
      if (suggestionsChannel) {
        await suggestionsChannel.send({ embeds: [decidedEmbed] }).catch(() => {});
      }
    }

    const submitter = await guild.members.fetch(userId).catch(() => null);
    if (submitter) {
      const dmText = isApprove
        ? `✅ Your suggestion in **${guild.name}** was **approved**! Thanks for the idea.`
        : `❌ Your suggestion in **${guild.name}** was **rejected**.`;
      await submitter.send(dmText).catch(() => {});
    }

    const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(isApprove ? '✅ Suggestion Approved' : '❌ Suggestion Rejected')
        .setDescription(`Suggestion by <@${userId}> reviewed by ${interaction.user}.`)
        .setColor(isApprove ? 0x2ECC71 : 0xE74C3C)
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    return true;
  }

  return false;
}

module.exports = { postPanel, handleSuggestionInteraction };
