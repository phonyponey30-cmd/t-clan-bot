// Ready-to-post embeds for Task Force 14: rules, lore, and welcome.
const { EmbedBuilder } = require('discord.js');

const COLOR_OD_GREEN = 0x3B4A2B;
const COLOR_GOLD = 0xC9A227;
const COLOR_BLOOD_RED = 0x8B0000;

function buildRulesEmbeds() {
  const main = new EmbedBuilder()
    .setTitle('📜 TASK FORCE 14 — RULES OF ENGAGEMENT')
    .setDescription(
      'Every operator is expected to know and follow these rules. Ignorance is not an excuse — ' +
      'violations are enforced by Command and the Auto-Mod system.'
    )
    .setColor(COLOR_OD_GREEN)
    .addFields(
      {
        name: '1️⃣ Chain of Command',
        value: 'Respect Command Staff, NCOs, and Team Leads at all times. Orders given during operations are final — disputes go through proper channels after the op, not during.',
      },
      {
        name: '2️⃣ Conduct',
        value: 'No racism, sexism, harassment, or hate speech of any kind. No NSFW content. Treat every operator with respect on and off comms.',
      },
      {
        name: '3️⃣ Comms Discipline',
        value: 'No mic spam, music, or excessive noise on voice channels during operations. Keep radio traffic professional and to the point.',
      },
      {
        name: '4️⃣ No Spam / Advertising',
        value: 'No self-promotion, unsolicited DMs, or advertising other servers/communities. No invite links outside the official one.',
      },
      {
        name: '5️⃣ Attendance & Activity',
        value: 'Operators are expected to notify their Team Lead if they cannot make a scheduled operation. Prolonged inactivity without notice may result in role demotion.',
      },
      {
        name: '6️⃣ Application & Ranks',
        value: 'All new members start as 📝 Applicant → 📋 Recruit → 🎯 Operator. Promotions are earned through attendance, conduct, and skill — not requested.',
      },
      {
        name: '7️⃣ Enforcement',
        value: 'Rule violations escalate: **Warning → Timeout → Kick → Ban**. Serious violations (hate speech, cheating, leaks) result in an immediate ban.',
      },
    )
    .setFooter({ text: 'Task Force 14 — Ready. Reliable. Relentless.' })
    .setTimestamp();

  return [main];
}

function buildLoreEmbed() {
  return new EmbedBuilder()
    .setTitle('🎖️ THE STORY OF TASK FORCE 14')
    .setDescription(
      '*Classified briefing — clearance granted.*\n\n' +
      'Task Force 14 was stood up as a joint special operations element, drawn from the best operators ' +
      'across allied units and assembled for missions too sensitive, too fast-moving, or too deniable for ' +
      'conventional forces. TF14 does not exist on any official roster — when the mission requires it, ' +
      'TF14 exists just long enough to finish the job.\n\n' +
      'Operators are selected for adaptability, discipline, and the ability to operate independently in ' +
      'small, self-sufficient teams. The Task Force has no single home base — it deploys wherever the ' +
      'mission takes it, running everything from direct-action raids and hostage rescue to long-range ' +
      'reconnaissance and unconventional warfare.\n\n' +
      '**Motto:** *"Ready. Reliable. Relentless."*'
    )
    .addFields(
      { name: '🎯 Mission', value: 'Execute high-value operations other units can\'t — or won\'t.', inline: false },
      { name: '🪖 Structure', value: 'Command Staff → NCOs → Team Leads → Operators, organized into independent squads.', inline: false },
      { name: '🌍 Theater', value: 'Global — TF14 deploys wherever Command sends it.', inline: false },
    )
    .setColor(COLOR_GOLD)
    .setFooter({ text: 'Task Force 14 — Est. designation classified' })
    .setTimestamp();
}

async function postRules(channel) {
  const embeds = buildRulesEmbeds();
  await channel.send({ embeds });
}

async function postLore(channel) {
  await channel.send({ embeds: [buildLoreEmbed()] });
}

function buildWelcomeEmbed(member) {
  const guild = member.guild;
  const chan = (name) => guild.channels.cache.find(c => c.name === name);
  return new EmbedBuilder()
    .setTitle(`🪖 Welcome to Task Force 14, ${member.user.username}`)
    .setDescription(
      `You are operator #${guild.memberCount} to join the roster.\n\n` +
      `📜 Read the Rules of Engagement → <#${chan('rules')?.id ?? 'rules'}>\n` +
      `🎖️ Learn the story of TF14 → <#${chan('lore')?.id ?? 'lore'}>\n` +
      `✅ Verify to gain full access → <#${chan('verify')?.id ?? 'verify'}>\n` +
      `📝 Apply for Operator selection → <#${chan('apply-here')?.id ?? 'apply-here'}>\n` +
      `💬 Introduce yourself → <#${chan('introductions')?.id ?? 'introductions'}>\n\n` +
      `Stand by for orders, operator. *Ready. Reliable. Relentless.*`
    )
    .setColor(COLOR_BLOOD_RED)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: 'Task Force 14' })
    .setTimestamp();
}

module.exports = { buildRulesEmbeds, buildLoreEmbed, buildWelcomeEmbed, postRules, postLore };
