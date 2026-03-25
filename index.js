// Load environment variables from a .env file for secure credential management.
// Load environment variables

// Retrieve sensitive information from environment variables.
const { TOKEN, CLIENT_ID, GUILD_ID } = process.env;

// Debug log
console.log("TOKEN:", TOKEN ? "✅ exists" : "❌ missing");
console.log("CLIENT_ID:", CLIENT_ID ? "✅ exists" : "❌ missing");
console.log("GUILD_ID:", GUILD_ID ? "✅ exists" : "❌ missing");

// Import necessary components from the discord.js library.
const { Client, GatewayIntentBits, Events, Partials, REST, Routes, SlashCommandBuilder } = require('discord.js');

// --- Configuration and Initialization ---

// Error handling for missing critical environment variables.
if (!TOKEN) {
  console.error('ERROR: Missing TOKEN in .env file.');
  process.exit(1);
}
if (!CLIENT_ID || !GUILD_ID) {
  // These are crucial for slash command registration.
  console.warn('WARNING: CLIENT_ID or GUILD_ID missing in .env file. Slash commands may not register correctly.');
}

// Initialize the Discord client with the required intents and partials.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,          // Required for basic guild information.
    GatewayIntentBits.GuildMessages,   // Required to receive messages in guilds.
    GatewayIntentBits.MessageContent,  // Required to read message content (for some commands).
    GatewayIntentBits.DirectMessages,  // Required for direct messages (if any).
  ],
  partials: [Partials.Channel], // Allows handling of DM channels.
});

// --- 1. COMMAND DEFINITION AND REGISTRATION ---
// Define all slash commands the bot will use.

// Commands from the first script:
// 'panel' command requires an external module to handle its logic.
// 'flood' command sends a specified message multiple times.

// Commands from the second script:
// 'nuke' command: Resets the current channel.
const nukeCommand = new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Wipe this channel and drop the CUBAA visuals');

// 'ghost' command: Sends a rapid series of pings to a specified target.
const ghostCommand = new SlashCommandBuilder()
    .setName('ghost')
    .setDescription('Send 10 phantom pings to a target')
    .addMentionableOption(o => o
        .setName('target')
        .setDescription('Target to ghost')
        .setRequired(true));

// 'hook' command: Executes a high-speed webhook message burst.
const hookCommand = new SlashCommandBuilder()
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
        .setMaxValue(20));

// Group all command definitions into an array and convert them to JSON format for API interaction.
const commands = [
    // Commands that need registration via REST API
    nukeCommand,
    ghostCommand,
    hookCommand,
    // The 'panel' command will be handled via a separate command handler,
    // assuming it's not a slash command registered this way.
    // If 'panel' IS a slash command, it should be added here with a SlashCommandBuilder.
    // For now, we assume it's handled by message commands or imported logic.
].map(cmd => cmd.toJSON());

// Initialize the REST API client for registering commands.
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Immediately Invoked Function Expression (IIFE) to register commands when the bot starts.
(async () => {
    // Only attempt registration if CLIENT_ID and GUILD_ID are present.
    if (CLIENT_ID && GUILD_ID) {
        try {
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            console.log('✅ Backdoe Kit Commands Registered!');
        } catch (err) {
            console.error('Failed to register Backdoe Kit commands:', err);
        }
    } else {
        console.log('Skipping slash command registration: CLIENT_ID or GUILD_ID not found in .env.');
    }
})();

// --- 2. Bot Event Handlers ---

// Event handler for when the bot is ready.
client.once(Events.ClientReady, function() {
  console.log("Bot is online as " + client.user.tag);

  // Dynamic status messages to keep the bot engaging.
  const statuses = [
    { name: "BitchEm Taking Over", type: 0 }, // PLAYING
    { name: "Textin Yo Ho", type: 2 },          // LISTENING
    { name: "You a bitch nigga", type: 3 },     // WATCHING
    { name: "Come Get Bitch", type: 5 },              // COMPETING (This type is rarely used and might not display as expected)
  ];

  let i = 0;
  // Rotate through statuses every 10 seconds.
  setInterval(function() {
    client.user.setPresence({ activities: [statuses[i]], status: "online" });
    i = (i + 1) % statuses.length;
  }, 10000);
});

// Event handler for any interaction (like slash commands).
client.on(Events.InteractionCreate, async interaction => {
  // Only process chat input commands.
  if (!interaction.isChatInputCommand()) return;

  try {
    
    // --- PANEL COMMAND ---
    // Assuming 'sendServerPanel' is correctly exported and handles slash command interactions.
    if (interaction.commandName === "panel") {
      // Check if the module is available and then call the function.
      const { sendServerPanel } = require("./commands/panel"); // Lazy load if needed, or ensure it's loaded at top
      if (sendServerPanel) {
        await sendServerPanel(interaction);
      } else {
        console.error("Panel command module not found or exported correctly.");
        await interaction.reply({ content: "Panel command logic is missing.", ephemeral: true });
      }
    }

    // --- FLOOD COMMAND ---
    if (interaction.commandName === "flood") {
      const message = interaction.options.getString("message");
      const count = interaction.options.getInteger("count") || 1; // Default to 1 if count is not provided.

      // Determine the channel, fetching if necessary.
      const channel =
        interaction.channel ||
        (await interaction.client.channels.fetch(interaction.channelId));

      // Ensure the channel is text-based and accessible.
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({
          content: "Cannot send messages in this type of channel.",
          ephemeral: true,
        });
      }

      // Send the message 'count' times.
      for (let j = 0; j < count; j++) {
        await channel.send(message + " [Master mind]");
      }

      // Acknowledge the flood operation.
      await interaction.reply({
        content: `Successfully sent message ${count} times!`,
        ephemeral: true,
      });
    }

    // --- NUKE COMMAND ---
    if (interaction.commandName === 'nuke') {
        // Permission check: User must have 'ManageChannels'.
        if (!interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ content: 'You lack the necessary permissions to nuke this channel.', ephemeral: true });
        }

        try {
            const position = interaction.channel.position;
            const parent = interaction.channel.parentId;

            // Clone the channel, delete the original, and set position.
            const newChannel = await interaction.channel.clone({ parent });
            await interaction.channel.delete();
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
    if (interaction.commandName === 'ghost') {
        const target = interaction.options.getMentionable('target');

        try {
            await interaction.reply({ content: `Initiating ghost ping sequence for ${target}...`, ephemeral: true });

            // Loop 10 times to send and immediately delete messages.
            for (let i = 0; i < 10; i++) {
                const msg = await interaction.channel.send(`${target}`);
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
  
    // --- WEBHOOK / HOOK COMMAND ---
    if (interaction.commandName === "hook") {
      const content = interaction.options.getString("content");
      const count = interaction.options.getInteger("count") || 3;

      const safeCount = Math.min(count, 5);

      await interaction.reply({
        content: `Sending ${safeCount} messages...`,
        ephemeral: true
      });

      for (let i = 0; i < safeCount; i++) {
        await interaction.channel.send(content);
      }
    }

  } catch (error) {
    console.error("Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Something went wrong.",
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN);
