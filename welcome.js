const { EmbedBuilder } = require('discord.js');

async function handleGuildMemberAdd(member) {
  const guild = member.guild;

  // Assign Unverified role on join if it exists
  const unverified = guild.roles.cache.find(r => r.name === '👋 Unverified');
  if (unverified) {
    await member.roles.add(unverified).catch(() => {});
  }

  const welcomeChannel = guild.channels.cache.find(c => c.name === 'welcome');
  if (!welcomeChannel) return;

  const embed = new EmbedBuilder()
    .setTitle(`Welcome to The T Clan, ${member.user.username}! 🎉`)
    .setDescription(
      `You're member #${guild.memberCount}!\n\n` +
      `📖 Read the rules → <#${guild.channels.cache.find(c => c.name === 'rules')?.id ?? 'rules'}>\n` +
      `✅ Verify yourself → <#${guild.channels.cache.find(c => c.name === 'verify')?.id ?? 'verify'}>\n` +
      `🎬 Post your content → <#${guild.channels.cache.find(c => c.name === 'post-your-tiktok')?.id ?? 'post-your-tiktok'}>\n` +
      `💬 Say hi → <#${guild.channels.cache.find(c => c.name === 'introduce-yourself')?.id ?? 'introduce-yourself'}>\n\n` +
      `We're glad you're here — let's help each other blow up 🚀`
    )
    .setColor(0x9B59B6)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: 'The T Clan' })
    .setTimestamp();

  await welcomeChannel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
}

module.exports = { handleGuildMemberAdd };
