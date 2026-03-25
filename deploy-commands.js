require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // your bot ID
const GUILD_ID = process.env.GUILD_ID;   // your server ID (for testing)

const commands = [
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Show server control panel"),

  new SlashCommandBuilder()
    .setName("flood")
    .setDescription("Send a message multiple times")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Message to send")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("count")
        .setDescription("How many times")
        .setRequired(false))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("Registering commands...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Commands registered!");
  } catch (error) {
    console.error(error);
  }
})();
