require('dotenv').config();
const { REST, Routes } = require('discord.js');
const commands = require('./commands').map(c => c.data.toJSON());

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands deployed.');
  } catch (err) {
    console.error(err);
  }
})();
