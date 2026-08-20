// Posts a curated list of TikTok creator resources (editing, trends, music, growth) to #resources-and-links.

const { EmbedBuilder } = require('discord.js');

function buildEmbeds() {
  const main = new EmbedBuilder()
    .setTitle('📚 Creator Resources & Links')
    .setDescription('A curated toolkit to help you edit, plan, and grow your TikTok content.')
    .setColor(0xFF0050)
    .addFields(
      {
        name: '🎬 Editing Tools',
        value:
          '• [CapCut](https://www.capcut.com) — free mobile/desktop editor made by TikTok\'s parent company, built-in TikTok templates\n' +
          '• [InShot](https://inshot.com) — mobile editing app for quick cuts, text, and transitions\n' +
          '• [Adobe Premiere Rush](https://www.adobe.com/products/premiere-rush.html) — cross-platform editor for more advanced edits',
      },
      {
        name: '📈 Trends & Analytics',
        value:
          '• [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter) — trending sounds, hashtags, and top ads by region\n' +
          '• [Google Trends](https://trends.google.com) — spot rising search interest before it peaks\n' +
          '• TikTok\'s built-in Analytics (Creator Tools → Analytics) — track views, watch time, and follower activity',
      },
      {
        name: '🎵 Music & Sound',
        value:
          '• TikTok\'s Commercial Music Library (in-app, under Sounds) — safe, royalty-free tracks for monetized content\n' +
          '• [Epidemic Sound](https://www.epidemicsound.com) — licensed music/SFX subscription for creators\n' +
          '• [Artlist](https://artlist.io) — royalty-free music and sound effects',
      },
      {
        name: '🖼️ Graphics & Thumbnails',
        value:
          '• [Canva](https://www.canva.com) — free design tool for covers, thumbnails, and promo graphics\n' +
          '• [VSCO](https://vsco.co) — photo editing and filters for cross-posting content',
      },
      {
        name: '🗓️ Planning & Scheduling',
        value:
          '• [Later](https://later.com) — schedule and plan TikTok posts in advance\n' +
          '• [Notion](https://www.notion.so) — content calendar and idea tracking\n' +
          '• [Linktree](https://linktr.ee) — one link in your bio for all your platforms',
      },
      {
        name: '🎓 Learning & Growth',
        value:
          '• TikTok Creator Academy (in-app, under Creator Tools) — official tips on growth, monetization, and best practices\n' +
          '• #algorithm-talk and #growth-tips in this server — community-tested strategies',
      },
    )
    .setFooter({ text: 'Have a resource to add? Drop it in #suggestions.' })
    .setTimestamp();

  return [main];
}

async function postResources(channel) {
  await channel.send({ embeds: buildEmbeds() });
}

module.exports = { postResources };
