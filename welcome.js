const { buildWelcomeEmbed } = require('./tf14Content');

async function handleGuildMemberAdd(member) {
  const guild = member.guild;

  // Assign Unverified role on join if it exists
  const unverified = guild.roles.cache.find(r => r.name === '👋 Unverified');
  if (unverified) {
    await member.roles.add(unverified).catch(() => {});
  }

  const welcomeChannel = guild.channels.cache.find(c => c.name === 'welcome');
  if (!welcomeChannel) return;

  const embed = buildWelcomeEmbed(member);
  await welcomeChannel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
}

module.exports = { handleGuildMemberAdd };
