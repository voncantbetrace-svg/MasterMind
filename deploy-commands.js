// Load environment variables from a .env file for secure credential management.
require('dotenv').config();

// Import necessary components from the discord.js library.
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

// Retrieve Discord API credentials from environment variables.
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// Error handling for missing critical environment variables.
if (!TOKEN) {
  console.error('ERROR: Missing TOKEN in .env file.');
  process.exit(1);
}
if (!CLIENT_ID || !GUILD_ID) {
  console.warn('WARNING: CLIENT_ID or GUILD_ID missing in .env file. Slash commands may not register correctly.');
}

// Initialize the Discord client with the required intents.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --- 1. COMMAND DEFINITION AND REGISTRATION ---
// Define all slash commands the bot will use in a single array.

const commands = [
    // Commands from the first script:
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Show server control panel'),
    new SlashCommandBuilder()
        .setName('flood')
        .setDescription('Send a message multiple times')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('How many times')
                .setRequired(false)), // Making count optional as per original definition

    // Commands from the second script:
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Wipe this channel and drop the CUBAA visuals'),
    new SlashCommandBuilder()
        .setName('ghost')
        .setDescription('Send 10 phantom pings to a target')
        .addMentionableOption(o => o
            .setName('target')
            .setDescription('Target to ghost')
            .setRequired(true)),
    new SlashCommandBuilder()
        .setName('hook')
        .setDescription('Execute a high-speed webhook burst')
        .addStringOption(o => o
            .setName('content')
            .setDescription('Message')
            .setRequired(true))
        .addIntegerOption(o => o
            .setName('count')
            .setDescription('Amount (1-20)')
            .setMinValue(1)
            .setMaxValue(20)),
].map(cmd => cmd.toJSON()); // Convert all SlashCommandBuilder objects to JSON format.

// Initialize the REST API client for registering commands.
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Immediately Invoked Function Expression (IIFE) to register commands upon bot startup.
(async () => {
    // Only attempt registration if CLIENT_ID and GUILD_ID are present.
    if (CLIENT_ID && GUILD_ID) {
        try {
            console.log('Registering commands...');
            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
                { body: commands }
            );
            console.log('✅ All commands registered successfully!');
        } catch (err) {
            console.error('Failed to register commands:', err);
        }
    } else {
        console.log('Skipping slash command registration: CLIENT_ID or GUILD_ID not found in .env.');
    }
})();

// --- 2. EXECUTION LOGIC ---
// Listen for interaction events (like slash command usage).
client.on('interactionCreate', async interaction => {
    // Only process chat input commands.
    if (!interaction.isChatInputCommand()) return;

    // Destructure common properties for easier access.
    const { commandName, options, channel, member } = interaction;

    // --- PANEL COMMAND ---
    // This assumes 'panel' command logic is handled externally or directly here.
    // If 'sendServerPanel' is from a separate file, ensure it's imported at the top.
    if (commandName === 'panel') {
        // Placeholder: If 'sendServerPanel' is an imported function, call it.
        // Example:
        // const { sendServerPanel } = require("./commands/panel"); // Ensure this is imported at the top if needed.
        // await sendServerPanel(interaction);
        await interaction.reply({ content: 'Panel command logic needs to be implemented here or imported.', ephemeral: true });
    }

    // --- FLOOD COMMAND ---
    if (commandName === 'flood') {
        const message = options.getString('message');
        // Default count to 1 if not provided, or if user enters an invalid value for an optional field.
        const count = options.getInteger('count') || 1;

        // Ensure the channel is text-based and accessible.
        if (!channel || !channel.isTextBased()) {
            return interaction.reply({
                content: "Cannot send messages in this type of channel.",
                ephemeral: true,
            });
        }

        try {
            // Send the message 'count' times.
            for (let j = 0; j < count; j++) {
                await channel.send(message + " [Master mind]");
            }
            // Acknowledge the flood operation.
            await interaction.reply({
                content: `Successfully sent message ${count} times!`,
                ephemeral: true,
            });
        } catch (error) {
            console.error('Flood command failed:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred during the flood operation.', ephemeral: true });
            }
        }
    }

    // --- NUKE COMMAND ---
    if (commandName === 'nuke') {
        // Permission check: User must have 'ManageChannels'.
        if (!member.permissions.has('ManageChannels')) {
            return interaction.reply({ content: 'You lack the necessary permissions to nuke this channel.', ephemeral: true });
        }

        try {
            const position = channel.position;
            const parent = channel.parentId;

            // Clone the channel, delete the original, and set position.
            const newChannel = await channel.clone({ parent });
            await channel.delete();
            await newChannel.setPosition(position);

            // Send the new "CUBAA" assets.
            await newChannel.send({
                content: `# ⚠️ CUBAA RESET \n**A clean slate. Backdoe operations have resumed.**`,
                files: [
                    'https://files.catbox.moe/94jn9d.png',
                    'https://files.catbox.moe/h88cpu.gif'
                ]
            });
            await interaction.reply({ content: 'Channel nuke successful. A new slate has been established.', ephemeral: true });

        } catch (error) {
            console.error('Nuke command failed:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred during the nuke operation.', ephemeral: true });
            }
        }
    }

    // --- GHOST PING LOOP LOGIC ---
    if (commandName === 'ghost') {
        const target = options.getMentionable('target');

        try {
            await interaction.reply({ content: `Initiating ghost ping sequence for ${target}...`, ephemeral: true });

            // Loop 10 times to send and immediately delete messages.
            for (let i = 0; i < 10; i++) {
                const msg = await channel.send(`${target}`);
                await msg.delete().catch(err => console.warn(`Failed to delete ghost ping message: ${err.message}`));
            }
            await interaction.followUp({ content: 'Ghost ping sequence complete.', ephemeral: true });

        } catch (error) {
            console.error('Ghost command failed:', error);
            if (!interaction.replied && !interaction.followedUp) {
                await interaction.reply({ content: 'An error occurred during the ghost ping operation.', ephemeral: true });
            }
        }
    }

    // --- WEBHOOK BURST LOGIC ---
    if (commandName === 'hook') {
        const content = options.getString('content');
        const count = options.getInteger('count') || 5; // Default to 5 if count is not provided.

        try {
            await interaction.reply({ content: `Deploying webhook burst with ${count} messages...`, ephemeral: true });

            const webhook = await channel.createWebhook({
                name: 'Backdoe System',
                avatar: 'https://files.catbox.moe/94jn9d.png'
            });

            // Send the specified content 'count' times via the webhook.
            for (let i = 0; i < count; i++) {
                await webhook.send(content);
            }

            // Clean up by deleting the webhook after a short delay.
            setTimeout(() => webhook.delete().catch(err => console.warn(`Failed to delete webhook: ${err.message}`)), 5000);
            await interaction.followUp({ content: 'Webhook burst deployed and webhook cleaned up.', ephemeral: true });

        } catch (error) {
            console.error('Hook command failed:', error);
            if (!interaction.replied && !interaction.followedUp) {
                await interaction.reply({ content: 'An error occurred during the webhook burst operation.', ephemeral: true });
            }
        }
    }

  } catch (err) {
    // General error handling for any unhandled exceptions during command processing.
    console.error("Unhandled error during interaction:", err);

    // Attempt to reply to the user if the interaction hasn't been replied to yet.
    if (!interaction.replied) {
      await interaction.reply({
        content: "An unexpected error occurred! Please try again later.",
        ephemeral: true,
      });
    }
  }
});

// --- Global Error Handling ---
// Handles unhandled promise rejections to prevent unexpected crashes.
process.on("unhandledRejection", function(err) {
  console.error("Unhandled promise rejection:", err);
});

// --- Bot Login ---
// Attempt to log the bot into Discord using the provided token.
client.login(TOKEN).catch(err => {
  console.error('Login failed:', err);
  process.exit(1); // Exit the process if login fails.
});
