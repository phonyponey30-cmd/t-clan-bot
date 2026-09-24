const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const PASS_SCORE = 85;
const MAX_SCORE = 100;

const recordsPath = path.join(__dirname, 'data', 'bctRecords.json');

function loadRecords() {
  try { return JSON.parse(fs.readFileSync(recordsPath, 'utf8')); } catch { return {}; }
}

function saveRecords(data) {
  fs.writeFileSync(recordsPath, JSON.stringify(data, null, 2));
}

function isPassing(score) {
  return score >= PASS_SCORE;
}

function recordScore({ userId, recruitName, score, graderId }) {
  if (score < 0 || score > MAX_SCORE) {
    throw new Error(`Score must be between 0 and ${MAX_SCORE}.`);
  }
  const records = loadRecords();
  records[userId] = {
    recruitName,
    score,
    passed: isPassing(score),
    graderId,
    date: new Date().toISOString(),
  };
  saveRecords(records);
  return records[userId];
}

function getRecord(userId) {
  const records = loadRecords();
  return records[userId] || null;
}

function clearRecord(userId) {
  const records = loadRecords();
  delete records[userId];
  saveRecords(records);
}

function buildRecordEmbed(record) {
  return new EmbedBuilder()
    .setTitle('🎖️ BCT Record Sheet')
    .setColor(record.passed ? 0x2ECC71 : 0xE74C3C)
    .addFields(
      { name: 'Recruit', value: record.recruitName, inline: true },
      { name: 'Score', value: `${record.score}/${MAX_SCORE}`, inline: true },
      { name: 'Result', value: record.passed ? '✅ PASS' : '❌ FAIL', inline: true },
      { name: 'Passing Score', value: `${PASS_SCORE}/${MAX_SCORE}`, inline: true },
      { name: 'Graded By', value: `<@${record.graderId}>`, inline: true },
    )
    .setTimestamp(new Date(record.date));
}

function buildSheetEmbed() {
  const records = loadRecords();
  const entries = Object.entries(records);
  const embed = new EmbedBuilder()
    .setTitle('🎖️ Arma3 BCT Record Sheet')
    .setDescription(`Passing score: ${PASS_SCORE}/${MAX_SCORE}`)
    .setColor(0x3498DB)
    .setTimestamp();

  if (entries.length === 0) {
    embed.addFields({ name: 'No records yet', value: 'Use /bct-record to log a recruit\'s score.' });
    return embed;
  }

  const sorted = entries.sort(([, a], [, b]) => b.score - a.score);
  const lines = sorted.map(([userId, r]) =>
    `${r.passed ? '✅' : '❌'} **${r.recruitName}** (<@${userId}>) — ${r.score}/${MAX_SCORE}`
  );
  const passCount = sorted.filter(([, r]) => r.passed).length;

  for (let i = 0; i < lines.length; i += 15) {
    embed.addFields({ name: i === 0 ? `Recruits (${passCount}/${sorted.length} passed)` : '​', value: lines.slice(i, i + 15).join('\n') });
  }
  return embed;
}

module.exports = {
  PASS_SCORE,
  MAX_SCORE,
  isPassing,
  recordScore,
  getRecord,
  clearRecord,
  buildRecordEmbed,
  buildSheetEmbed,
};
