"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const link_1 = require("./embeds/link");
const error_1 = require("./embeds/error");
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages] });
client.once('ready', () => {
    console.log(`Bot está online como ${client.user?.tag}`);
    client.user?.setActivity({
        name: "Use /assinar para adquirir os Pontos de Decisão",
        type: discord_js_1.ActivityType.Playing
    });
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand())
        return;
    if (interaction.commandName === 'assinar') {
        const discordId = interaction.user.id;
        const username = interaction.user.username;
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        if (!guild) {
            console.error("Erro ao buscar o servidor");
            interaction.reply({ embeds: [error_1.ErrorEmbed.setTitle('❌ Ocorreu um erro inesperado').setDescription('Ocorreu um erro ao tentar assinar o plano')], ephemeral: true });
            return;
        }
        const member = await guild.members.fetch(discordId);
        if (!member) {
            console.error("Erro ao buscar o membro");
            interaction.reply({ embeds: [error_1.ErrorEmbed.setTitle('❌ Ocorreu um erro inesperado').setDescription('Ocorreu um erro ao tentar assinar o plano')], ephemeral: true });
            return;
        }
        if (member.roles.cache.has(process.env.ROLE_ID))
            return interaction.reply({ embeds: [error_1.ErrorEmbed.setTitle('❌ Você já tem assinatura!').setDescription('Identificamos que você já tem acesso à assinatura, não é necessario assinar novamente.').setFooter({ text: "Qualquer problema, contate o suporte!" })], ephemeral: true });
        try {
            const response = await fetch(`${process.env.API_URL}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ discordId, username })
            });
            const data = await response.json();
            if (data.session === 'exists') {
                await interaction.reply({
                    embeds: [error_1.ErrorEmbed.setTitle('❌ Você já tem uma sessão em Aberto!').setDescription('Você já tem uma sessão em aberto, cheque o seu privado para concluir sua assinatura.').setFooter({ text: "Qualquer problema, contate o suporte!" })],
                    ephemeral: true,
                });
                return;
            }
            if (!data.url) {
                await interaction.reply({
                    embeds: [error_1.ErrorEmbed.setTitle('❌ Não foi possível gerar um link da Stripe').setDescription('Não consegui gerar um link de pagamento, tente novamente mais tarde...')],
                    ephemeral: true,
                });
                return;
            }
            const button = new discord_js_1.ButtonBuilder()
                .setLabel('Assinar')
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(data.url);
            const row = new discord_js_1.ActionRowBuilder().addComponents(button);
            const dmMessage = await interaction.user.send({
                embeds: [link_1.LinkEmbed],
                components: [row]
            });
            const setMessage = await fetch(`${process.env.API_URL}/cache/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ discordId, messageId: dmMessage.id }),
            });
            const message_response = await setMessage.json();
            console.log(message_response);
            await interaction.reply({
                content: 'Link de pagamento enviado por mensagem privada',
                ephemeral: true
            });
        }
        catch (error) {
            /* await interaction.reply({
                embeds: [ErrorEmbed.setTitle('❌ Ocorreu um erro inesperado').setDescription('Não consegui gerar um link de pagamento, tente novamente mais tarde...')],
                ephemeral: true
            }) */
            console.error(error);
        }
    }
});
client.login(process.env.DISCORD_TOKEN);
