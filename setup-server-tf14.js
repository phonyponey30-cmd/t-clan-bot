// One-time script: builds the TF14 milsim Discord server structure (roles, categories, channels).
// Run with: npm run setup-tf14
// Safe to re-run — it skips roles/channels that already exist by name.

require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, ChannelType } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function withRetry(fn, label, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = attempt * 2000;
      console.log(`  ⚠️ ${label} failed (${err.code || err.message}), retrying in ${wait / 1000}s... (${attempt}/${retries})`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

const ROLES = [
  { name: '⭐ Commanding Officer', color: 0xFFD700, permissions: [PermissionsBitField.Flags.Administrator], hoist: true },
  { name: '🎖️ Command Staff', color: 0xE74C3C, permissions: [
      PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ModerateMembers
    ], hoist: true },
  { name: '🪖 NCO', color: 0xE67E22, permissions: [
      PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ModerateMembers
    ], hoist: true },
  { name: '🤖 Auto-Mod', color: 0x95A5A6, permissions: [
      PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ModerateMembers
    ], hoist: false },
  { name: '🔰 Team Lead', color: 0x3498DB, permissions: [], hoist: true },
  { name: '🎯 Operator', color: 0x2ECC71, permissions: [], hoist: true },
  { name: '📋 Recruit', color: 0x1ABC9C, permissions: [], hoist: true },
  { name: '📝 Applicant', color: 0x99AAB5, permissions: [], hoist: false },
  { name: '👋 Unverified', color: 0x5A5A5A, permissions: [], hoist: false },
  { name: '📢 Op Ping', color: 0xE0245E, permissions: [], hoist: false, mentionable: true },
];

// name -> role config for permission overwrites below
const R = {};

const STRUCTURE = [
  {
    category: '📋 INTAKE',
    visibility: 'public',
    channels: [
      { name: 'welcome', topic: 'Welcome to Task Force 14.' },
      { name: 'rules', topic: 'TF14 Rules of Engagement — read before participating.' },
      { name: 'lore', topic: 'The story and mission of Task Force 14.' },
      { name: 'verify', topic: 'React to verify and unlock the server.' },
      { name: 'announcements', readonly: true, topic: 'Official TF14 command announcements.' },
      { name: 'apply-here', topic: 'Apply to join Task Force 14 — click the button to open an application.' },
    ],
  },
  {
    category: '🎖️ COMMAND',
    visibility: 'members',
    channels: [
      { name: 'command-briefings', readonly: true, topic: 'Official briefings and directives from Command.' },
      { name: 'op-schedule', topic: 'Upcoming operations and events.' },
      { name: 'aar-reports', topic: 'After-Action Reports for completed operations.' },
    ],
  },
  {
    category: '💬 SQUAD ROOM',
    visibility: 'members',
    channels: [
      { name: 'general-chat' },
      { name: 'introductions' },
      { name: 'off-topic' },
      { name: 'memes' },
      { name: 'gear-and-loadouts' },
      { name: 'clips-and-highlights' },
    ],
  },
  {
    category: '🎯 TRAINING',
    visibility: 'members',
    channels: [
      { name: 'training-schedule', topic: 'Upcoming training sessions and qualification courses.' },
      { name: 'tactics-and-sops', readonly: true, topic: 'Standard Operating Procedures and tactics doctrine.' },
      { name: 'range-day', topic: 'Marksmanship and weapon handling practice discussion.' },
    ],
  },
  {
    category: '🛠️ STAFF ONLY',
    visibility: 'staff',
    channels: [
      { name: 'staff-chat' },
      { name: 'mod-logs' },
      { name: 'automod-dashboard' },
      { name: 'command-decisions' },
      { name: 'applications-review', topic: 'Review incoming applications.' },
      { name: 'warning-appeals-review', topic: 'Staff review queue for warning appeals — Accept/Deny.' },
    ],
  },
  {
    category: '🎫 SUPPORT',
    visibility: 'members',
    channels: [
      { name: 'suggestions' },
      { name: 'report-a-member', topic: 'Report a rule-breaking member — click the button to open a private ticket.' },
      { name: 'help-support', topic: 'Get help or ask a question — click the button to open a private ticket.' },
      { name: 'warning-appeals', topic: 'Think a warning was unfair? Appeal it here.' },
    ],
  },
];

const VOICE_CATEGORY = {
  category: '🎙️ COMMS',
  visibility: 'members',
  voiceChannels: ['Command Net', 'Squad 1', 'Squad 2', 'Squad 3', 'Training Range', 'Lounge', 'AFK'],
};

async function ensureRoles(guild) {
  for (const cfg of ROLES) {
    let role = guild.roles.cache.find(r => r.name === cfg.name);
    if (!role) {
      role = await withRetry(() => guild.roles.create({
        name: cfg.name,
        color: cfg.color,
        permissions: cfg.permissions,
        hoist: cfg.hoist,
        mentionable: !!cfg.mentionable,
        reason: 'TF14 server setup',
      }), `create role ${cfg.name}`);
      console.log(`Created role: ${cfg.name}`);
    }
    R[cfg.name] = role;
  }
}

function overwritesFor(guild, visibility) {
  const everyone = guild.roles.everyone;
  const view = PermissionsBitField.Flags.ViewChannel;
  // The bot must always be able to see every channel (staff-only ones included)
  // regardless of which roles are granted access, or automod logging/commands silently break.
  const botOverwrite = { id: guild.client.user.id, allow: [view] };

  switch (visibility) {
    case 'public':
      return [{ id: everyone.id, allow: [view] }, botOverwrite];
    case 'members':
      return [
        { id: everyone.id, deny: [view] },
        { id: R['📋 Recruit'].id, allow: [view] },
        { id: R['🎯 Operator'].id, allow: [view] },
        { id: R['🔰 Team Lead'].id, allow: [view] },
        { id: R['🪖 NCO'].id, allow: [view] },
        { id: R['🎖️ Command Staff'].id, allow: [view] },
        { id: R['⭐ Commanding Officer'].id, allow: [view] },
        botOverwrite,
      ];
    case 'staff':
      return [
        { id: everyone.id, deny: [view] },
        { id: R['🪖 NCO'].id, allow: [view] },
        { id: R['🎖️ Command Staff'].id, allow: [view] },
        { id: R['⭐ Commanding Officer'].id, allow: [view] },
        botOverwrite,
      ];
    default:
      return [botOverwrite];
  }
}

async function ensureCategory(guild, name, visibility) {
  let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === name);
  if (!cat) {
    cat = await withRetry(() => guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwritesFor(guild, visibility),
    }), `create category ${name}`);
    console.log(`Created category: ${name}`);
  } else {
    await withRetry(() => cat.permissionOverwrites.set(overwritesFor(guild, visibility)), `update permissions for ${name}`);
    console.log(`Updated permissions: ${name}`);
  }
  return cat;
}

async function ensureTextChannel(guild, parent, chan) {
  let existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.name === chan.name && c.parentId === parent.id
  );
  if (!existing) {
    const overwrites = [...parent.permissionOverwrites.cache.values()].map(o => ({
      id: o.id, allow: o.allow, deny: o.deny,
    }));
    if (chan.readonly) {
      overwrites.push({ id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.SendMessages] });
    }
    existing = await withRetry(() => guild.channels.create({
      name: chan.name,
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: chan.topic || undefined,
      permissionOverwrites: overwrites,
    }), `create channel #${chan.name}`);
    console.log(`  Created channel: #${chan.name}`);
  } else {
    await withRetry(() => existing.lockPermissions(), `sync permissions for #${chan.name}`);
    if (chan.readonly) {
      await withRetry(
        () => existing.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }),
        `re-apply read-only lock for #${chan.name}`
      );
    }
  }
  return existing;
}

async function ensureVoiceChannel(guild, parent, name) {
  let existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildVoice && c.name === name && c.parentId === parent.id
  );
  if (!existing) {
    existing = await withRetry(() => guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: parent.id,
    }), `create voice channel ${name}`);
    console.log(`  Created voice channel: ${name}`);
  } else {
    await withRetry(() => existing.lockPermissions(), `sync permissions for voice ${name}`);
  }
  return existing;
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  console.log('\n--- Creating roles ---');
  await ensureRoles(guild);

  console.log('\n--- Creating categories & channels ---');
  for (const block of STRUCTURE) {
    const cat = await ensureCategory(guild, block.category, block.visibility);
    for (const chan of block.channels) {
      await ensureTextChannel(guild, cat, chan);
    }
  }

  const voiceCat = await ensureCategory(guild, VOICE_CATEGORY.category, VOICE_CATEGORY.visibility);
  for (const vc of VOICE_CATEGORY.voiceChannels) {
    await ensureVoiceChannel(guild, voiceCat, vc);
  }

  console.log('\n✅ TF14 server setup complete. Run "npm run deploy-commands" then "npm start" to launch the live bot.');
  process.exit(0);
});

client.on('error', (err) => {
  console.error('\n❌ Connection error:', err.message);
  console.error('This is usually transient network trouble reaching Discord. Just re-run "npm run setup-tf14" — it skips anything already created.');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('\n❌ Setup failed:', err.message || err);
  console.error('Re-run "npm run setup-tf14" — it skips roles/channels that already exist, so it will pick up where it left off.');
  process.exit(1);
});

client.login(process.env.DISCORD_TOKEN);
