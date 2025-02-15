import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

import { LinkEmbed } from './embeds/link';
import { ErrorEmbed } from './embeds/error';


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
  console.log(`Bot está online como ${client.user?.tag}`);
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'assinar') {
    const discordId = interaction.user.id;
    const username = interaction.user.username;

    const guild = await client.guilds.fetch(process.env.GUILD_ID as string);
    
    if(!guild) return interaction.reply({ embeds: [ErrorEmbed.setTitle('❌ Ocorreu um erro inesperado').setDescription('Ocorreu um erro ao tentar assinar o plano' )], ephemeral: true })
    
    const member = await guild.members.fetch(discordId);

    if(!member) return interaction.reply({ embeds: [ErrorEmbed.setTitle('❌ Ocorreu umn erro inesperado').setDescription('Ocorreu um erro ao tentar assinar o plano' )] })

    if(member.roles.cache.has(process.env.ROLE_ID as string)) return interaction.reply({ embeds: [ErrorEmbed.setTitle('❌ Você já tem assinatura!').setDescription('Identificamos que você já tem acesso à assinatura, não é necessario assinar novamente.' ).setFooter({text: "Qualquer problema, contate o suporte!"})], ephemeral: true})

    try {
      const response = await fetch(`${process.env.API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discordId, username })
      })

      const data = await response.json();

      if(data.session === 'exists') {
        return await interaction.reply({
          embeds: [ErrorEmbed.setTitle('❌ Você já tem uma sessão em Aberto!').setDescription('Você já tem uma sessão em aberto, cheque o seu privado para concluir sua assinatura.').setFooter({text: "Qualquer problema, contate o suporte!"})],
          ephemeral: true,
        })
      }
      
      if(!data.url) {
        return await interaction.reply({
          embeds: [ErrorEmbed.setTitle('❌ Não foi possível gerar um link da Stripe').setDescription('Não consegui gerar um link de pagamento, tente novamente mais tarde...')],
          ephemeral: true,
        })
      }

      const button = new ButtonBuilder()
      .setLabel('Assinar')
      .setStyle(ButtonStyle.Link)
      .setURL(data.url)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button)

      const dmMessage = await interaction.user.send({
                                   embeds: [LinkEmbed],
                                   components: [row]
                                 })

      const setMessage = await fetch(`${process.env.API_URL}/cache/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discordId, messageId: dmMessage.id }),
      })

      const message_response = await setMessage.json()
      console.log(message_response)
      
      await interaction.reply({
        content: 'Link de pagamento enviado por mensagem privada',
        ephemeral: true
      })
    } catch (error) {
      await interaction.reply({
          embeds: [ErrorEmbed.setTitle('❌ Ocorreu um erro inesperado').setDescription('Não consegui gerar um link de pagamento, tente novamente mais tarde...')],
          ephemeral: true
      })
      console.error(error)
    }
  }
})

client.login(process.env.DISCORD_TOKEN);