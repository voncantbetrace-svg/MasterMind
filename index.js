require("dotenv").config();
const { Client, GatewayIntentBits, Events, Partials } = require("discord.js");

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("ERROR: Missing TOKEN.");
  process.exit(1);
}

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
    { name: "Master mind Taking Over", type: 0 },
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
  try {
    if (interaction.commandName === "flood") {
      const message = interaction.options.getString("message");
      const count = interaction.options.getInteger("count") || 1;
      const channel = interaction.channel || await interaction.client.channels.fetch(interaction.channelId);
      if (!channel || !channel.isTextBased()) {
        return interaction.reply({ content: "Cannot send messages here.", ephemeral: true });
      }
      for (let j = 0; j < count; j++) {
        await channel.send(message + " [Master mind]");
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
