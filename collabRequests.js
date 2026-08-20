// Collab request system: a button in #collab-requests opens a modal form.
// The submitted request posts with an "Accept" button — whoever clicks it
// gets a private channel with the requester to talk in.

const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ChannelType, PermissionsBitField,
} = require('discord.js');

const STAFF_ROLE_NAMES = ['🛡️ Admin', '🔨 Moderator', '👑 Founder'];

function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🤝 Looking for a Collab?')
    .setDescription('Click the button below to post a collab request. When another creator accepts, you\'ll both get a private channel to plan it out.')
    .setColor(0x9B59B6);
}

function buildPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('collab_request_open').setLabel('Request a Collab').setEmoji('🤝').setStyle(ButtonStyle.Primary)
  );
}

async function postPanel(channel) {
  await channel.send({ embeds: [buildPanelEmbed()], components: [buildPanelRow()] });
}

function buildModal() {
  const modal = new ModalBuilder().setCustomId('collab_request_modal').setTitle('Request a Collab');

  const nicheInput = new TextInputBuilder()
    .setCustomId('collab_niche')
    .setLabel('Your content niche')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Comedy, Dance, Gaming, IRL')
    .setRequired(true);

  const lookingForInput = new TextInputBuilder()
    .setCustomId('collab_looking_for')
    .setLabel('What kind of collab are you looking for?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g. Duet partner, stitch collab, joint video idea...')
    .setRequired(true);

  const availabilityInput = new TextInputBuilder()
    .setCustomId('collab_availability')
    .setLabel('Availability (optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g. Weekends, evenings EST')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nicheInput),
    new ActionRowBuilder().addComponents(lookingForInput),
    new ActionRowBuilder().addComponents(availabilityInput),
  );
  return modal;
}

function staffOverwrites(guild) {
  return STAFF_ROLE_NAMES
    .map(name => guild.roles.cache.find(r => r.name === name))
    .filter(Boolean)
    .map(role => ({ id: role.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }));
}

async function handleCollabInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'collab_request_open') {
    await interaction.showModal(buildModal());
    return true;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'collab_request_modal') {
    const niche = interaction.fields.getTextInputValue('collab_niche').trim();
    const lookingFor = interaction.fields.getTextInputValue('collab_looking_for').trim();
    const availability = interaction.fields.getTextInputValue('collab_availability')?.trim();

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('🤝 New Collab Request')
      .addFields(
        { name: 'Niche', value: niche, inline: true },
        { name: 'Availability', value: availability || 'Not specified', inline: true },
        { name: 'Looking for', value: lookingFor },
      )
      .setColor(0x9B59B6)
      .setFooter({ text: 'Click Accept to start a private channel with this creator.' })
      .setTimestamp();

    const acceptRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`collab_accept_${interaction.user.id}`).setLabel('Accept').setEmoji('✅').setStyle(ButtonStyle.Success)
    );

    await interaction.channel.send({ content: `${interaction.user}`, embeds: [embed], components: [acceptRow] });
    await interaction.reply({ content: '✅ Your collab request has been posted!', ephemeral: true });
    return true;
  }

  if (interaction.isButton() && interaction.customId.startsWith('collab_accept_')) {
    const requesterId = interaction.customId.replace('collab_accept_', '');

    if (interaction.user.id === requesterId) {
      await interaction.reply({ content: 'You can\'t accept your own collab request.', ephemeral: true });
      return true;
    }

    // Prevent double-accept: check if buttons already removed from the message
    if (interaction.message.components.length === 0) {
      await interaction.reply({ content: 'This request has already been accepted.', ephemeral: true });
      return true;
    }

    const guild = interaction.guild;
    const requester = await guild.members.fetch(requesterId).catch(() => null);
    if (!requester) {
      await interaction.reply({ content: 'Could not find the original requester (they may have left the server).', ephemeral: true });
      return true;
    }

    await interaction.deferUpdate();

    let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🎬 TIKTOK HUB');
    const channelName = `collab-${requester.user.username}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category ? category.id : undefined,
      topic: `Collab channel between ${requester.user.tag} and ${interaction.user.tag}`,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: requesterId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: guild.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
        ...staffOverwrites(guild),
      ],
    });

    const introEmbed = new EmbedBuilder()
      .setTitle('🤝 Collab Matched!')
      .setDescription(`${requester} and ${interaction.user} — you're matched! Use this channel to plan your collab.`)
      .setColor(0x2ECC71)
      .setTimestamp();

    await channel.send({ content: `${requester} ${interaction.user}`, embeds: [introEmbed] });

    const acceptedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(0x2ECC71)
      .setFooter({ text: `✅ Accepted by ${interaction.user.tag}` });

    await interaction.message.edit({ embeds: [acceptedEmbed], components: [] });
    await interaction.followUp({ content: `✅ Matched! Head to <#${channel.id}>`, ephemeral: true });
    return true;
  }

  return false;
}

module.exports = { postPanel, handleCollabInteraction };
