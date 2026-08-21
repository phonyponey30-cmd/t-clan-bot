// One-time script: builds the entire T Clan server structure (roles, categories, channels).
// Run with: npm run setup-server
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
  { name: '👑 Founder', color: 0xFFD700, permissions: [PermissionsBitField.Flags.Administrator], hoist: true },
  { name: '🛡️ Admin', color: 0xE74C3C, permissions: [
      PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.BanMembers, PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ModerateMembers
    ], hoist: true },
  { name: '🔨 Moderator', color: 0xE67E22, permissions: [
      PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ModerateMembers
    ], hoist: true },
  { name: '🤖 Auto-Mod', color: 0x95A5A6, permissions: [
      PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ModerateMembers
    ], hoist: false },
  { name: '🎥 Verified Creator', color: 0x9B59B6, permissions: [], hoist: true },
  { name: '⭐ VIP', color: 0xFF69B4, permissions: [], hoist: true },
  { name: '🎨 Content Team', color: 0x1ABC9C, permissions: [], hoist: true },
  { name: '🐣 Member', color: 0x2ECC71, permissions: [], hoist: false },
  { name: '👋 Unverified', color: 0x99AAB5, permissions: [], hoist: false },
  { name: '🔴 Live Ping', color: 0xE0245E, permissions: [], hoist: false, mentionable: true },
];

// name -> role config for permission overwrites below
const R = {};

const STRUCTURE = [
  {
    category: '📋 WELCOME',
    visibility: 'public',
    channels: [
      { name: 'welcome', topic: 'Welcome new members!' },
      { name: 'rules', topic: 'Server rules — read before participating.' },
      { name: 'verify', topic: 'React to verify and unlock the server.' },
      { name: 'announcements', readonly: true, topic: 'Official T Clan news.' },
      { name: 'faq', topic: 'Frequently asked questions.' },
    ],
  },
  {
    category: '💬 COMMUNITY',
    visibility: 'members',
    channels: [
      { name: 'general-chat' },
      { name: 'introduce-yourself' },
      { name: 'clip-of-the-day' },
      { name: 'trending-sounds' },
      { name: 'duets-and-stitches' },
      { name: 'off-topic' },
      { name: 'memes' },
    ],
  },
  {
    category: '🎬 TIKTOK HUB',
    visibility: 'members',
    channels: [
      { name: 'post-your-tiktok' },
      { name: 'tiktok-live', topic: 'Live notifications — register your TikTok to get pinged when you go live!' },
      { name: 'feedback-and-critique' },
      { name: 'algorithm-talk' },
      { name: 'collab-requests' },
      { name: 'niche-comedy' },
      { name: 'niche-dance' },
      { name: 'niche-gaming' },
      { name: 'niche-irl' },
      { name: 'viral-wins' },
    ],
  },
  {
    category: '🎨 CREATOR RESOURCES',
    visibility: 'members',
    channels: [
      { name: 'editing-help' },
      { name: 'tools-and-apps' },
      { name: 'trending-sounds-archive' },
      { name: 'growth-tips' },
      { name: 'resources-and-links' },
    ],
  },
  {
    category: '🏆 LEVELS',
    visibility: 'members',
    channels: [
      { name: 'rank-check', topic: 'Run /rank to see your level, XP, and position. Reach level 1000 to earn VIP!' },
      { name: 'leaderboard', readonly: true, topic: 'Top members by XP — updates automatically every 5 minutes.' },
    ],
  },
  {
    category: '⭐ VIP',
    visibility: 'vip',
    channels: [
      { name: 'vip-lounge' },
      { name: 'booster-perks' },
    ],
  },
  {
    category: '🛠️ STAFF ONLY',
    visibility: 'staff',
    channels: [
      { name: 'staff-chat' },
      { name: 'mod-logs' },
      { name: 'automod-dashboard' },
      { name: 'admin-announcements' },
      { name: 'ban-appeals-review' },
      { name: 'suggestions-review' },
      { name: 'warning-appeals-review', topic: 'Staff review queue for warning appeals — Accept/Deny.' },
    ],
  },
  {
    category: '🎫 SUPPORT',
    visibility: 'members',
    channels: [
      { name: 'suggestions' },
      { name: 'report-a-user', topic: 'Report a rule-breaking user — click the button to open a private ticket.' },
      { name: 'complaints', topic: 'File a complaint — click the button to open a private ticket.' },
      { name: 'help-support', topic: 'Get help or ask a question — click the button to open a private ticket.' },
      { name: 'create-a-ticket', topic: 'General ticket panel covering all categories.' },
      { name: 'warning-appeals', topic: 'Think a warning was unfair? Appeal it here.' },
    ],
  },
];

const VOICE_CATEGORY = {
  category: '🎙️ VOICE',
  visibility: 'members',
  voiceChannels: ['Lounge', 'Content Creation Session', 'Collab Voice 1', 'Collab Voice 2', 'AFK'],
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
        reason: 'The T Clan server setup',
      }), `create role ${cfg.name}`);
      console.log(`Created role: ${cfg.name}`);
    }
    R[cfg.name] = role;
  }
}

function overwritesFor(guild, visibility) {
  const everyone = guild.roles.everyone;
  const deny = PermissionsBitField.Flags.ViewChannel;
  const view = PermissionsBitField.Flags.ViewChannel;
  // The bot must always be able to see every channel (staff-only ones included)
  // regardless of which roles are granted access, or automod logging/commands silently break.
  const botOverwrite = { id: guild.client.user.id, allow: [view] };

  switch (visibility) {
    case 'public':
      // everyone can see welcome category (including unverified)
      return [{ id: everyone.id, allow: [view] }, botOverwrite];
    case 'members':
      return [
        { id: everyone.id, deny: [view] },
        { id: R['🐣 Member'].id, allow: [view] },
        { id: R['🎥 Verified Creator'].id, allow: [view] },
        { id: R['⭐ VIP'].id, allow: [view] },
        { id: R['🎨 Content Team'].id, allow: [view] },
        { id: R['🔨 Moderator'].id, allow: [view] },
        { id: R['🛡️ Admin'].id, allow: [view] },
        { id: R['👑 Founder'].id, allow: [view] },
        botOverwrite,
      ];
    case 'vip':
      return [
        { id: everyone.id, deny: [view] },
        { id: R['⭐ VIP'].id, allow: [view] },
        { id: R['🔨 Moderator'].id, allow: [view] },
        { id: R['🛡️ Admin'].id, allow: [view] },
        { id: R['👑 Founder'].id, allow: [view] },
        botOverwrite,
      ];
    case 'staff':
      return [
        { id: everyone.id, deny: [view] },
        { id: R['🔨 Moderator'].id, allow: [view] },
        { id: R['🛡️ Admin'].id, allow: [view] },
        { id: R['👑 Founder'].id, allow: [view] },
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
    // Re-apply overwrites so the bot's own view access gets patched onto categories
    // that already existed from a prior run.
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

  console.log('\n✅ Server setup complete. You can now run "npm start" to launch the live bot.');
  process.exit(0);
});

client.on('error', (err) => {
  console.error('\n❌ Connection error:', err.message);
  console.error('This is usually transient network trouble reaching Discord. Just re-run "npm run setup-server" — it skips anything already created.');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('\n❌ Setup failed:', err.message || err);
  console.error('Re-run "npm run setup-server" — it skips roles/channels that already exist, so it will pick up where it left off.');
  process.exit(1);
});

client.login(process.env.DISCORD_TOKEN);
