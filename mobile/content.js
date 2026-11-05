// All editable copy lives here. Wrap text in `backticks` for channel/code style and **double stars** for bold.
export const INVITE = 'https://discord.gg/q4pMAjQqNQ';

export const RULES = {
  common: [
    'Be kind. No bullying, hate, or harassment, ever.',
    'No spam, scams, or sketchy links. Auto-mod removes them and may time you out.',
    "Never share personal info (yours or anyone's): address, school, phone, passwords.",
    'Only post content you made or have permission to share.',
  ],
  teen: [
    'Keep it age-appropriate. If something makes you uncomfortable, leave and tell a trusted adult or a mod.',
    'If someone asks to move to a private chat, asks for photos, or asks you to keep a secret, stop and report it.',
  ],
  adult: [
    'Adults: keep chats appropriate for a community with younger members. Do not DM minors for private chats.',
    'Be a good example. Report problems instead of arguing with rule breakers.',
  ],
};

export const SAFETY = {
  teen: [
    ['dm', 'I turned off DMs from server members (Server name → Privacy Settings)'],
    ['filter', 'I set Settings → Privacy & Safety → Safe direct messaging to "Keep me safe"'],
    ['know', 'I know how to report: tell a mod, use `#report-a-user`, or tap Report on any message'],
    ['adult', "I'll tell a parent or trusted adult if anyone makes me uncomfortable"],
  ],
  adult: [
    ['dm', 'I reviewed my DM and friend request settings (Server name → Privacy Settings)'],
    ['filter', 'I enabled Settings → Privacy & Safety → Safe direct messaging'],
    ['know', 'I know how to report: use `#report-a-user` or tap Report on any message'],
    ['adult', 'I understand that interacting privately with minors is not allowed here'],
  ],
};

export const TOUR = [
  ['📋 Welcome', 'Start here: `#welcome`, `#rules`, `#verify`, `#faq`.'],
  ['💬 Community', '`#general-chat`, `#introduce-yourself`, `#memes`, `#clip-of-the-day` and more.'],
  ['🎬 TikTok Hub', 'Share videos in `#post-your-tiktok`, get kind feedback in `#feedback-and-critique`, find collabs, and register for live pings in `#tiktok-live`.'],
  ['🎨 Creator Resources', '`#editing-help`, `#tools-and-apps`, `#growth-tips` for learning and leveling up.'],
  ['🏆 Levels', 'Chat to earn XP. Check your level with `/rank` in `#rank-check`; reach level 1000 for VIP.'],
  ['🎫 Support', 'Use `#help-support`, `#report-a-user` or `#create-a-ticket` for a private chat with staff. `#warning-appeals` if a warning seems unfair.'],
];

export const INTRO = {
  teen: "Hi everyone! 👋 I'm [nickname]. I make [type of videos] and I'm into [hobby]. Excited to be here!",
  adult: "Hi all! 👋 I'm [name/nickname]. I create [type of content] and I'm here to [learn / collab / share]. Nice to meet you!",
};

export const PARENT = {
  server: [
    'New members land in a locked **Unverified** role and must read the rules and verify.',
    '**Auto-mod** removes invite spam, scams, risky links, and mass pinging, then escalates: warning, timeout, kick, ban.',
    'Moderators review actions in private staff channels.',
    'Anyone can open a **private ticket** to report a user.',
  ],
  account: [
    "Turn on **Family Center** in Discord to see who they chat with (not message contents).",
    'Settings → Privacy & Safety → set the safe-direct-messaging filter to **Keep me safe**.',
    'Turn off **Allow direct messages from server members** for this server.',
    'Review who can send friend requests.',
  ],
  familyCenterUrl: 'https://discord.com/safety/family-center',
};
