require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, Routes, REST, EmbedBuilder, Events } = require('discord.js');

// --- ENVIRONMENT VARIABLES ---
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Missing TOKEN, CLIENT_ID, or GUILD_ID in .env");
  process.exit(1);
}

// --- COLOR MAP ---
const COLOR_MAP = {
  red: 0xff0000,
  blue: 0x0064ff,
  green: 0x00c800,
  yellow: 0xffff00,
  purple: 0xa000ff,
  orange: 0xffa500
};

const INVITE_LINK = "https://your-discord-invite-link";
const COOLDOWN_MS = 4000;
const cooldowns = new Map();

// --- DISCORD CLIENT ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// --- SLASH COMMAND DEFINITIONS ---
const commands = [
  // PANEL command
  new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Show the server panel"),

  // FLOOD command
  new SlashCommandBuilder()
    .setName("flood")
    .setDescription("Send a message multiple times")
    .addStringOption(opt => opt.setName("message").setDescription("Message").setRequired(true))
    .addIntegerOption(opt => opt.setName("count").setDescription("Times to send").setRequired(true)),

  // SPAMCUSTOM
  new SlashCommandBuilder()
    .setName("spamcustom")
    .setDescription("Spam a custom message")
    .addStringOption(opt => opt.setName("text").setDescription("Message").setRequired(true)),

  // SENDEMBED
  new SlashCommandBuilder()
    .setName("sendembed")
    .setDescription("Send an embed")
    .addStringOption(opt => opt.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(opt => opt.setName("message").setDescription("Message").setRequired(true))
    .addStringOption(opt => 
      opt.setName("color")
         .setDescription("Color")
         .setRequired(true)
         .addChoices(
           { name: "Red", value: "red" },
           { name: "Blue", value: "blue" },
           { name: "Green", value: "green" },
           { name: "Yellow", value: "yellow" },
           { name: "Purple", value: "purple" },
           { name: "Orange", value: "orange" }
         )
    ),

  // SENDMESSAGE
  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a message")
    .addStringOption(opt => opt.setName("message").setDescription("Message").setRequired(true)),

  // NUKE
  new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Wipe this channel and drop the CUBAA visuals"),

  // GHOST
  new SlashCommandBuilder()
    .setName("ghost")
    .setDescription("Send 10 phantom pings to a target")
    .addMentionableOption(opt => opt.setName("target").setDescription("Target to ghost").setRequired(true)),

  // HOOK
  new SlashCommandBuilder()
    .setName("hook")
    .setDescription("Execute a high-speed webhook burst")
    .addStringOption(opt => opt.setName("content").setDescription("Message").setRequired(true))
    .addIntegerOption(opt => opt.setName("count").setDescription("Amount (1-20)").setMinValue(1).setMaxValue(20))
].map(cmd => cmd.toJSON());

// --- REGISTER COMMANDS ---
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log("✅ All commands registered successfully!");
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
})();

// --- CLIENT READY ---
client.once(Events.ClientReady, () => {
  console.log(`Bot online as ${client.user.tag}`);
});

// --- INTERACTION HANDLER ---
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  const now = Date.now();

  try {
    // --- PANEL ---
    if (interaction.commandName === "panel") {
      const { sendServerPanel } = require("./commands/panel");
      if (sendServerPanel) return await sendServerPanel(interaction);
      return interaction.reply({ content: "Panel command missing.", ephemeral: true });
    }

    // --- FLOOD ---
    if (interaction.commandName === "flood") {
      const message = interaction.options.getString("message");
      const count = interaction.options.getInteger("count");
      const channel = interaction.channel || await interaction.client.channels.fetch(interaction.channelId);

      if (!channel || !channel.isTextBased()) return interaction.reply({ content: "Cannot send in this channel.", ephemeral: true });

      for (let i = 0; i < count; i++) await channel.send(message + " [Master mind]");
      return interaction.reply({ content: `Sent message ${count} times.`, ephemeral: true });
    }

    // --- SPAMCUSTOM ---
    if (interaction.commandName === "spamcustom") {
      const lastUsed = cooldowns.get(userId) || 0;
      if (now - lastUsed < COOLDOWN_MS) {
        const remaining = ((COOLDOWN_MS - (now - lastUsed)) / 1000).toFixed(1);
        return interaction.reply({ content: `Cooldown: wait ${remaining}s`, ephemeral: true });
      }
      cooldowns.set(userId, now);

      const text = interaction.options.getString("text");
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Join Our Discord!").setDescription(`[Click here](${INVITE_LINK})`).setColor(0xff0000)], ephemeral: true });

      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 150));
        await interaction.followUp({ content: text });
      }
    }

    // --- SENDEMBED ---
    if (interaction.commandName === "sendembed") {
      const title = interaction.options.getString("title");
      const message = interaction.options.getString("message");
      const color = interaction.options.getString("color");
      const embed = new EmbedBuilder().setTitle(title).setDescription(message.replace(/\\n/g, "\n")).setColor(COLOR_MAP[color] || 0xffffff);
      await interaction.reply({ content: "Embed sent.", ephemeral: true });
      await interaction.followUp({ embeds: [embed] });
    }

    // --- SENDMESSAGE ---
    if (interaction.commandName === "sendmessage") {
      const message = interaction.options.getString("message");
      await interaction.reply({ content: "Message sent.", ephemeral: true });
      await interaction.followUp({ content: message.replace(/\\n/g, "\n") });
    }

    // --- NUKE ---
    if (interaction.commandName === "nuke") {
      if (!interaction.member.permissions.has("ManageChannels")) return interaction.reply({ content: "Missing permissions.", ephemeral: true });
      try {
        const position = interaction.channel.position;
        const parent = interaction.channel.parentId;
        const newChannel = await interaction.channel.clone({ parent });
        await interaction.channel.delete();
        await newChannel.setPosition(position);
        await newChannel.send({
          content: "# ⚠️ CUBAA RESET \n**A clean slate. Backdoe operations resumed.**",
          files: ["https://files.catbox.moe/94jn9d.png", "https://files.catbox.moe/h88cpu.gif"]
        });
        await interaction.reply({ content: "Channel nuked successfully.", ephemeral: true });
      } catch (err) { console.error(err); if (!interaction.replied) await interaction.reply({ content: "Nuke failed.", ephemeral: true }); }
    }

    // --- GHOST ---
    if (interaction.commandName === "ghost") {
      const target = interaction.options.getMentionable("target");
      try {
        await interaction.reply({ content: `Ghost pinging ${target}...`, ephemeral: true });
        for (let i = 0; i < 10; i++) {
          const msg = await interaction.channel.send(`${target}`);
          await msg.delete().catch(() => {});
        }
        await interaction.followUp({ content: "Ghost ping complete.", ephemeral: true });
      } catch (err) { console.error(err); if (!interaction.replied) await interaction.reply({ content: "Ghost ping failed.", ephemeral: true }); }
    }

    // --- HOOK ---
    if (interaction.commandName === "hook") {
      const content = interaction.options.getString("content");
      const count = interaction.options.getInteger("count") || 3;
      const safeCount = Math.min(count, 20);
      await interaction.reply({ content: `Sending ${safeCount} messages...`, ephemeral: true });
      for (let i = 0; i < safeCount; i++) await interaction.channel.send(content);
    }

  } catch (err) {
    console.error("Interaction error:", err);
    if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: "Something went wrong.", ephemeral: true });
  }
});

// --- LOGIN ---
client.login(TOKEN);
