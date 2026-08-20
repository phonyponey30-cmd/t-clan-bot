// Warning appeal system: button in #warning-appeals opens a modal form.
// The appeal is posted in #warning-appeals-review with Accept/Deny buttons for staff.
// Decisions are logged to #mod-logs and the appellant is DM'd the result.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsPath = path.join(__dirname, 'data', 'warnings.json');
function loadWarnings() {
  try { return JSON.parse(fs.readFileSync(warningsPath, 'utf8')); } catch { return {}; }
}
function saveWarnings(data) {
  fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
}

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('⚖️ Appeal a Warning')
    .setDescription('Think a warning or auto-mod action was a mistake? Click below to submit an appeal for staff review.')
    .setColor(0xF1C40F);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('warning_appeal_open').setLabel('Appeal a Warning').setEmoji('⚖️').setStyle(ButtonStyle.Secondary)
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildModal() {
  const modal = new ModalBuilder().setCustomId('warning_appeal_modal').setTitle('Appeal a Warning');

  const reasonInput = new TextInputBuilder()
    .setCustomId('appeal_reason')
    .setLabel('Why do you think this warning was a mistake?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Explain what happened and why you believe it should be reversed.')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
  return modal;
}

async function handleWarningAppealInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'warning_appeal_open') {
    const warnings = loadWarnings();
    const count = warnings[interaction.user.id] || 0;
    if (count === 0) {
      await interaction.reply({ content: 'You don\'t currently have any warnings on record.', ephemeral: true });
      return true;
    }
    await interaction.showModal(buildModal());
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'warning_appeal_modal') {
    const reason = interaction.fields.getTextInputValue('appeal_reason').trim();
    const warnings = loadWarnings();
    const count = warnings[interaction.user.id] || 0;

    const reviewChannel = interaction.guild.channels.cache.find(c => c.name === 'warning-appeals-review');
    if (!reviewChannel) {
      await interaction.reply({ content: 'Appeal review channel not found — contact staff directly.', ephemeral: true });
      return true;
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('⚖️ Warning Appeal')
      .addFields(
        { name: 'Current warning count', value: `${count}`, inline: true },
        { name: 'User', value: `${interaction.user}`, inline: true },
        { name: 'Appeal reason', value: reason },
      )
      .setColor(0xF1C40F)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`warning_appeal_accept_${interaction.user.id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`warning_appeal_deny_${interaction.user.id}`).setLabel('Deny').setEmoji('❌').setStyle(ButtonStyle.Danger),
    );

    await reviewChannel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Your appeal has been submitted for staff review.', ephemeral: true });
    return true;
  }

  if (interaction.isButton() && (interaction.customId.startsWith('warning_appeal_accept_') || interaction.customId.startsWith('warning_appeal_deny_'))) {
    const isAccept = interaction.customId.startsWith('warning_appeal_accept_');
    const userId = interaction.customId.replace(isAccept ? 'warning_appeal_accept_' : 'warning_appeal_deny_', '');

    if (interaction.message.components.length === 0) {
      await interaction.reply({ content: 'This appeal has already been reviewed.', ephemeral: true });
      return true;
    }

    const guild = interaction.guild;
    const warnings = loadWarnings();

    if (isAccept) {
      warnings[userId] = Math.max(0, (warnings[userId] || 0) - 1);
      saveWarnings(warnings);
    }

    const decidedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(isAccept ? 0x2ECC71 : 0xE74C3C)
      .setFooter({ text: `${isAccept ? '✅ Accepted' : '❌ Denied'} by ${interaction.user.tag}` });

    await interaction.update({ embeds: [decidedEmbed], components: [] });

    const appellant = await guild.members.fetch(userId).catch(() => null);
    if (appellant) {
      const dmText = isAccept
        ? `✅ Your warning appeal in **${guild.name}** was **accepted**. Your warning count has been reduced.`
        : `❌ Your warning appeal in **${guild.name}** was **denied**. The warning stands.`;
      await appellant.send(dmText).catch(() => {});
    }

    const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(isAccept ? '✅ Warning Appeal Accepted' : '❌ Warning Appeal Denied')
        .setDescription(`Appeal by <@${userId}> reviewed by ${interaction.user}.`)
        .setColor(isAccept ? 0x2ECC71 : 0xE74C3C)
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
    }

    return true;
  }

  return false;
}

module.exports = { postPanel, handleWarningAppealInteraction };
