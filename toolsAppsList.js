// Posts a comprehensive, categorized list of TikTok creator tools & apps to #tools-and-apps.

const { EmbedBuilder } = require('discord.js');

function buildEmbeds() {
  const embed = new EmbedBuilder()
    .setTitle('🧰 Creator Tools & Apps')
    .setDescription('A full toolkit for filming, editing, captioning, designing, and growing your TikTok content.')
    .setColor(0x3498DB)
    .addFields(
      {
        name: '🎥 Filming & Camera',
        value:
          '• **TikTok\'s built-in camera** — templates, green screen, auto-captions, and effects made for the app\'s algorithm\n' +
          '• [VSCO](https://vsco.co) — filters and manual camera controls for better raw footage',
      },
      {
        name: '✂️ Video Editing',
        value:
          '• [CapCut](https://www.capcut.com) — free, made by TikTok\'s parent company, huge template library\n' +
          '• [InShot](https://inshot.com) — quick mobile cuts, transitions, and text overlays\n' +
          '• [Adobe Premiere Rush](https://www.adobe.com/products/premiere-rush.html) — cross-platform, more advanced multi-track editing\n' +
          '• [Kapwing](https://www.kapwing.com) — browser-based editor, great for quick edits without installing anything',
      },
      {
        name: '📝 Captions & Subtitles',
        value:
          '• TikTok\'s built-in **Auto Captions** — fastest option, works right in the app\n' +
          '• [Kapwing](https://www.kapwing.com) — auto-generates and lets you style subtitles\n' +
          '• [Descript](https://www.descript.com) — edit video by editing a transcript, great for talking-head content\n' +
          '• [Rev](https://www.rev.com) — professional captioning/transcription if accuracy really matters',
      },
      {
        name: '🎨 Thumbnails & Graphics',
        value:
          '• [Canva](https://www.canva.com) — free templates for covers, promo graphics, and carousels\n' +
          '• [VSCO](https://vsco.co) — photo editing and filters for cross-posting to Instagram',
      },
      {
        name: '🎵 Music & Sound',
        value:
          '• TikTok\'s **Commercial Music Library** (in-app, under Sounds) — safe for monetized/branded content\n' +
          '• [Epidemic Sound](https://www.epidemicsound.com) — licensed music & SFX subscription\n' +
          '• [Artlist](https://artlist.io) — royalty-free music and sound effects',
      },
      {
        name: '📊 Analytics & Scheduling',
        value:
          '• TikTok\'s built-in **Analytics** (Creator Tools → Analytics) — views, watch time, follower activity\n' +
          '• [Later](https://later.com) — schedule posts across TikTok and other platforms\n' +
          '• [Metricool](https://metricool.com) — cross-platform analytics and scheduling in one dashboard',
      },
      {
        name: '📈 Trend & Growth Research',
        value:
          '• [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter) — trending sounds, hashtags, and top ads by region\n' +
          '• [Google Trends](https://trends.google.com) — spot rising search interest early\n' +
          '• [Exploding Topics](https://explodingtopics.com) — surfaces emerging trends before they peak',
      },
      {
        name: '🔗 Bio, Links & Planning',
        value:
          '• [Linktree](https://linktr.ee) — one link in your bio for all your platforms/products\n' +
          '• [Notion](https://www.notion.so) — content calendar, idea bank, and script planning',
      },
    )
    .setFooter({ text: 'Found a tool that deserves a spot here? Drop it in #suggestions.' })
    .setTimestamp();

  return [embed];
}

async function postToolsList(channel) {
  await channel.send({ embeds: buildEmbeds() });
}

module.exports = { postToolsList };
