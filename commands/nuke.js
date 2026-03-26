const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Wipes and resets the current channel.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels | PermissionsBitField.Flags.ManageMessages), // Requires channel and message management
    async execute(interaction) {
        const channel = interaction.channel;
        const guild = interaction.guild;

        await interaction.reply({ content: `Nuking ${channel.name}... This will take a moment.`, ephemeral: true });

        try {
            // 1. Save current channel info (for potential restore)
            // In a real scenario, you'd save more details: name, topic, position, type, permissions overwrites.
            const currentChannelInfo = {
                name: channel.name,
                position: channel.position,
                type: channel.type,
                // You'd need to handle permissions more intricately if recreating
            };
            // For now, let's just simulate saving some basic info. This would ideally go into `data.json` or a dedicated DB.
            // Example: Add to a 'restores' section for this guild/channel if you have one.

            // 2. Clone the channel
            const clonedChannel = await channel.clone({
                reason: 'Channel nuke initiated by ' + interaction.user.tag,
                // You might want to copy permissions from the original channel
            });

            // 3. Delete the original channel
            await channel.delete('Channel nuke: original deleted after cloning');

            // 4. Respond with the new channel and potentially some "nuke" message
            await clonedChannel.send(`💥 Channel Nuked! 💥\n\nThis channel was nuked by ${interaction.user.tag}. All previous content is gone!`);

            // --- Data Storage (Conceptual) ---
            const userId = interaction.user.id;
            const guildId = guild.id;

            if (!interaction.client.jsonData.users) interaction.client.jsonData.users = {};
            if (!interaction.client.jsonData.users[userId]) {
                interaction.client.jsonData.users[userId] = {
                    servers_nuked: 0, members_nuked: 0, biggest_server_nuked: 0, tokens: [], auto_nuke: false, stats: { servers_nuked: 0, members_nuked: 0, biggest_server_nuked: 0 }
                };
            }
            interaction.client.jsonData.users[userId].stats.servers_nuked++; // Increment server nuked count for the user
            // Update biggest_server_nuked if the current guild has more members than previously recorded
            const guildMemberCount = guild.memberCount;
            if (guildMemberCount > interaction.client.jsonData.users[userId].stats.biggest_server_nuked) {
                interaction.client.jsonData.users[userId].stats.biggest_server_nuked = guildMemberCount;
            }
            interaction.client.saveJsonData();
            // --- End Data Storage ---

        } catch (error) {
            console.error(`Error during nuke command: ${error}`);
            await interaction.followUp({ content: 'There was an error trying to nuke the channel. Please check permissions and console logs.', ephemeral: true });
        }
    },
};
