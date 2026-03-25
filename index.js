require("dotenv").config();
const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, Partials } = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("ERROR: Missing TOKEN or CLIENT_ID.");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("flood")
    .setDescription("Send messages with Madea emblem")
    .addStringOption(function(o) {
      return o.setName("message").setDescription("Message to send").setRequired(true);
    })
    .addIntegerOption(function(o) {
      return o.setName("count").setDescription("Number of times to send (1-16)").setMinValue(1).setMaxValue(16);
    }),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check if bot is alive"),
].map(function(cmd) {
  return Object.assign(cmd.toJSON(), {
    integration_types: [0, 1],
    contexts: [0, 1, 2],
  });
});

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async function() {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Global commands registered!");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, function() {
  console.log("Bot is online as " + client.user.tag);
  const statuses = [
    { name: "Madea Taking Over", type: 0 },
    { name: "Textin Yo Ho", type: 2 },
    { name: "You a bitch nigga", type: 3 },
    { name: "Come Die", type: 5 },
  ];
  let i = 0;
  setInterval(function() {
    client.user.setPresence({ activities: [statuses[i]], status: "online" });
    i = (i + 1) % statuses.length;
  }, 10000);
});

client.on(Events.InteractionCreate, async function(interaction) {
  if (!interaction.isChatInputCommand()) return;
    }
    if (interaction.commandName === "flood") {
      const message = interaction.options.getString("message");
      const count = interaction.options.getInteger("count") || 1;
      const channel = interaction.channel || await interaction.client.channels.fetch(interaction.channelId);
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: "Cannot send messages here.", ephemeral: true });
      }
      for (let j = 0; j < count; j++) {
        await channel.send(message + " [Madea]");
      }
      await interaction.reply({ content: "Sent message " + count + " times!", ephemeral: true });
    }
  } catch (err) {
    console.error("Error:", err);
    if (!interaction.replied) {
      await interaction.reply({ content: "Something went wrong!", ephemeral: true });
    }
  }
});

process.on("unhandledRejection", function(err) {
  console.error("Unhandled rejection:", err);
});

client.login(TOKEN).catch(function(err) {
  console.error("Login failed:", err);
  process.exit(1);
});
