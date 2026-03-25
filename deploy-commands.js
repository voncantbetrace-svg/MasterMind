const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// cooldown map
const cooldowns = new Map();

const COLOR_MAP = {
  red: 0xff0000,
  blue: 0x0064ff,
  green: 0x00c800,
  yellow: 0xffff00,
  purple: 0xa000ff,
  orange: 0xffa500
};

const INVITE_LINK = "https://your-discord-invite-link";

// 📜 Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("spamcustom")
    .setDescription("Spam a custom message")
    .addStringOption(opt =>
      opt.setName("text").setDescription("Message").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("sendembed")
    .setDescription("Send an embed")
    .addStringOption(opt =>
      opt.setName("title").setDescription("Title").setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName("color")
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

  new SlashCommandBuilder()
    .setName("sendmessage")
    .setDescription("Send a message")
    .addStringOption(opt =>
      opt.setName("message").setDescription("Message").setRequired(true)
    )
];

// 🧠 Register commands
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("Commands registered");
  } catch (err) {
    console.error(err);
  }
})();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // ⏱ cooldown logic
  const now = Date.now();
  const cooldownTime = 4000;

  if (interaction.commandName === "spamcustom") {
    const lastUsed = cooldowns.get(userId) || 0;
    const diff = now - lastUsed;

    if (diff < cooldownTime) {
      const remaining = ((cooldownTime - diff) / 1000).toFixed(1);

      return interaction.reply({
        content: `Cooldown: wait ${remaining}s`,
        ephemeral: true
      });
    }

    cooldowns.set(userId, now);

    const text = interaction.options.getString("text");

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Join Our Discord!")
          .setDescription(`[Click here](${INVITE_LINK})`)
          .setColor(0xff0000)
      ],
      ephemeral: true
    });

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 150));
      await interaction.followUp({ content: text });
    }
  }

  // 📦 sendembed
  if (interaction.commandName === "sendembed") {
    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message");
    const color = interaction.options.getString("color");

    await interaction.reply({ content: "Embed sent.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message.replace(/\\n/g, "\n"))
      .setColor(COLOR_MAP[color] || 0xffffff);

    await interaction.followUp({ embeds: [embed] });
  }

  // 💬 sendmessage
  if (interaction.commandName === "sendmessage") {
    const message = interaction.options.getString("message");

    await interaction.reply({ content: "Message sent.", ephemeral: true });

    await interaction.followUp({
      content: message.replace(/\\n/g, "\n")
    });
  }
});

client.login(TOKEN);
