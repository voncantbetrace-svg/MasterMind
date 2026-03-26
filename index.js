// deploy-commands.js

require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const path = require('path');
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [];
// Grab all the command files from the commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Check if the command file exports a SlashCommandBuilder object
    if (command.data instanceof SlashCommandBuilder) {
        commands.push(command.data.toJSON());
    } else {
        console.warn(`[WARNING] The command file ${file} in ${commandsPath} does not export a SlashCommandBuilder. Skipping.`);
    }
}

// Initialize the REST API client for registering commands.
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Immediately Invoked Function Expression (IIFE) to register commands upon script execution.
(async () => {
    // Only attempt registration if CLIENT_ID and GUILD_ID are present.
    // GUILD_ID is recommended for testing as global commands take up to an hour to register.
    const guildId = process.env.GUILD_ID;
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
        console.error('CLIENT_ID not found in .env. Cannot register commands globally or in guild.');
        return;
    }

    if (!guildId) {
        console.warn('GUILD_ID not found in .env. Commands will be registered globally (may take up to an hour).');
        // If GUILD_ID is not set, try to register globally.
        try {
            console.log(`Started refreshing application (/) commands globally...`);
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: commands },
            );
            console.log('✅ Successfully reloaded application (/) commands globally.');
        } catch (err) {
            console.error('Failed to register commands globally:', err);
        }
    } else {
        // If GUILD_ID is set, register commands for that specific guild.
        try {
            console.log(`Started refreshing application (/) commands for guild ${guildId}...`);
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: commands },
            );
            console.log(`✅ Successfully reloaded application (/) commands for guild ${guildId}.`);
        } catch (err) {
            console.error(`Failed to register commands for guild ${guildId}:`, err);
        }
    }
})();
