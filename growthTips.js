// Posts a comprehensive, categorized TikTok growth tips embed to #growth-tips.

const { EmbedBuilder } = require('discord.js');

function buildEmbeds() {
  const embed = new EmbedBuilder()
    .setTitle('📈 TikTok Growth Tips')
    .setDescription('A practical playbook for growing your account — from your first 3 seconds to building a real community.')
    .setColor(0x2ECC71)
    .addFields(
      {
        name: '🪝 The Hook (First 1–3 Seconds)',
        value:
          '• Say or show the most interesting part immediately — don\'t build up to it\n' +
          '• Open with a question, bold claim, or visual surprise, not a slow intro\n' +
          '• Text-on-screen in the first frame helps stop the scroll even with sound off',
      },
      {
        name: '⏱️ Watch Time & Retention',
        value:
          '• Watch time matters more than views — a short video watched to the end beats a long one people skip\n' +
          '• Cut anything that doesn\'t earn its place; tighten pacing ruthlessly\n' +
          '• Loop-friendly endings (the last frame flows into the first) boost replays',
      },
      {
        name: '🎵 Trends & Sounds',
        value:
          '• Use trending sounds early — the same sound gets easier to rank for as it saturates\n' +
          '• Check #trending-sounds and TikTok Creative Center for what\'s rising\n' +
          '• Put your own spin on a trend instead of copying it exactly — originality still gets rewarded',
      },
      {
        name: '🏷️ Captions & Hashtags',
        value:
          '• Use 3–5 relevant hashtags, mixing broad (#fyp) with niche-specific ones\n' +
          '• Write captions that add context or spark a reaction — a good caption drives comments\n' +
          '• Ask a genuine question in your caption to boost comment count (a strong engagement signal)',
      },
      {
        name: '📅 Consistency & Posting',
        value:
          '• Regular posting matters more than perfect posting — aim for a schedule you can actually sustain\n' +
          '• Post when your audience is active — check your Analytics tab for your followers\' peak times\n' +
          '• Batch-film and batch-edit so you always have a buffer of ready content',
      },
      {
        name: '💬 Engagement & Community',
        value:
          '• Reply to comments on your own videos, especially in the first hour — it boosts the post and builds loyalty\n' +
          '• Use Stitch/Duet to engage with other creators\' content in your niche\n' +
          '• Post in #post-your-tiktok and #feedback-and-critique here — real feedback beats guessing',
      },
      {
        name: '🤝 Collabs & Cross-Promotion',
        value:
          '• Duets and stitches with creators in your niche expose you to their audience\n' +
          '• Use #collab-requests here to find partners for joint videos\n' +
          '• Cross-post your best TikToks to Reels/Shorts — different platforms, same content, more reach',
      },
      {
        name: '📊 Use Your Analytics',
        value:
          '• Check which videos have the highest average watch % — that\'s your winning format, do more of it\n' +
          '• Track follower growth after specific videos to see what actually converts viewers to followers\n' +
          '• Don\'t chase view count alone — a video with fewer views but more shares/saves can grow your account faster',
      },
    )
    .setFooter({ text: 'Got a tip that\'s worked for you? Share it in #algorithm-talk.' })
    .setTimestamp();

  return [embed];
}

async function postGrowthTips(channel) {
  await channel.send({ embeds: buildEmbeds() });
}

module.exports = { postGrowthTips };
