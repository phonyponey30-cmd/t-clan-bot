require('dotenv').config();
const http = require('http');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { handleMessage } = require('./automod');
const { handleGuildMemberAdd } = require('./welcome');
const { handleTicketInteraction } = require('./tickets');
const { handleTikTokInteraction } = require('./tiktokSubmit');
const { handleCollabInteraction } = require('./collabRequests');
const { handleWarningAppealInteraction } = require('./warningAppeals');
const { handleSuggestionInteraction } = require('./suggestions');
const { handleLiveInteraction, startLivePolling } = require('./liveNotify');
const { handleEditingHelpInteraction } = require('./editingHelp');
const { handleMessageXp, startLeaderboardUpdater } = require('./leveling');
const commands = require('./commands');

// Minimal HTTP responder so host platforms (Railway/Render) that expect a
// listening port for health checks don't flag this bot-only process as failed.
if (process.env.PORT) {
  http.createServer((req, res) => res.end('T Clan bot is running.')).listen(process.env.PORT);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
for (const cmd of commands) client.commands.set(cmd.data.name, cmd);

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} is online and guarding The T Clan.`);
  startLivePolling(client);
  startLeaderboardUpdater(client);
});

client.on('guildMemberAdd', handleGuildMemberAdd);

client.on('messageCreate', (message) => {
  handleMessage(message).catch(console.error);
  handleMessageXp(message).catch(console.error);
});

// Reaction-role verification: react ✅ in #verify to get the Member role
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => {});
  if (reaction.message.partial) await reaction.message.fetch().catch(() => {});

  if (reaction.message.channel.name !== 'verify') return;
  if (reaction.emoji.name !== '✅') return;

  const guild = reaction.message.guild;
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  const memberRole = guild.roles.cache.find(r => r.name === '🐣 Member');
  const unverifiedRole = guild.roles.cache.find(r => r.name === '👋 Unverified');

  if (memberRole) await member.roles.add(memberRole).catch(() => {});
  if (unverifiedRole) await member.roles.remove(unverifiedRole).catch(() => {});
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }
    if (interaction.isButton()) {
      const handled = await handleTicketInteraction(interaction);
      if (handled) return;
      const tiktokHandled = await handleTikTokInteraction(interaction);
      if (tiktokHandled) return;
      const collabHandled = await handleCollabInteraction(interaction);
      if (collabHandled) return;
      const appealHandled = await handleWarningAppealInteraction(interaction);
      if (appealHandled) return;
      const suggestionHandled = await handleSuggestionInteraction(interaction);
      if (suggestionHandled) return;
      const liveHandled = await handleLiveInteraction(interaction);
      if (liveHandled) return;
      const editHelpHandled = await handleEditingHelpInteraction(interaction);
      if (editHelpHandled) return;
    }
    if (interaction.isModalSubmit()) {
      const tiktokHandled = await handleTikTokInteraction(interaction);
      if (tiktokHandled) return;
      const collabHandled = await handleCollabInteraction(interaction);
      if (collabHandled) return;
      const appealHandled = await handleWarningAppealInteraction(interaction);
      if (appealHandled) return;
      const suggestionHandled = await handleSuggestionInteraction(interaction);
      if (suggestionHandled) return;
      const liveHandled = await handleLiveInteraction(interaction);
      if (liveHandled) return;
      const editHelpHandled = await handleEditingHelpInteraction(interaction);
      if (editHelpHandled) return;
    }
  } catch (err) {
    console.error(err);
    const reply = { content: 'There was an error handling that action.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
