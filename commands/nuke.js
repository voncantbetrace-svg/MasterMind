// commands/nuke.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    // The 'data' property is what deploy-commands.js reads
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Wipes and resets the current channel.')
        // This specifies permissions required for the user to *use* this command
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels | PermissionsBitField.Flags.ManageMessages),
    
    // The 'execute' function is what index.js calls when the command is used
    async execute(interaction) {
        // --- THIS IS THE EXECUTION LOGIC ---
        const channel = interaction.channel;
        const guild = interaction.guild;

        await interaction.reply({ content: `Nuking ${channel.name}... This will take a moment.`, ephemeral: true });

        try {
            // 1. Save current channel info (for potential restore)
            // (Conceptual: actual restore logic would be more complex)
            const currentChannelInfo = {
                name: channel.name,
                position: channel.position,
                type: channel.type,
            };

            // 2. Clone the channel
            const clonedChannel = await channel.clone({
                reason: 'Channel nuke initiated by ' + interaction.user.tag,
            });

            // 3. Delete the original channel
            await channel.delete('Channel nuke: original deleted after cloning');

            // 4. Respond with the new channel and send assets
            await clonedChannel.send({
                content: `💥 Channel Nuked! 💥\n\nThis channel was nuked by ${interaction.user.tag}. All previous content is gone!`,
                files: [
                    'https://files.catbox.moe/94jn9d.png',
                    'https://files.catbox.moe/h88cpu.gif'
                ]
            });

            // Acknowledge the initial reply more clearly if needed, or remove if the first reply is sufficient.
            // await interaction.followUp({ content: 'Channel reset successful. New slate established.', ephemeral: true });


            // --- Data Storage (Conceptual) ---
            const userId = interaction.user.id;
            const guildId = guild.id;

            if (!interaction.client.jsonData) interaction.client.jsonData = {};
            if (!interaction.client.jsonData.users) interaction.client.jsonData.users = {};

            if (!interaction.client.jsonData.users[userId]) {
                interaction.client.jsonData.users[userId] = {
                    servers_nuked: 0, members_nuked: 0, biggest_server_nuked: 0, tokens: [], auto_nuke: false, stats: { servers_nuked: 0, members_nuked: 0, biggest_server_nuked: 0 }
                };
            }
            interaction.client.jsonData.users[userId].stats.servers_nuked++;
            const guildMemberCount = guild.memberCount;
            if (guildMemberCount > interaction.client.jsonData.users[userId].stats.biggest_server_nuked) {
                interaction.client.jsonData.users[userId].stats.biggest_server_nuked = guildMemberCount;
            }
            interaction.client.saveJsonData();
            // --- End Data Storage ---

            // Final confirmation message (can be removed if the initial reply is enough)
            await interaction.reply({ content: 'Channel nuke successful. A new slate has been established.', ephemeral: true });


        } catch (error) {
            console.error(`Error during nuke command: ${error}`);
            // Use followUp if interaction.reply has already been called, otherwise use reply.
            if (interaction.replied) {
                await interaction.followUp({ content: 'There was an error trying to nuke the channel. Please check permissions and console logs.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error trying to nuke the channel. Please check permissions and console logs.', ephemeral: true });
            }
        }
    },
};
