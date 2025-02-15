import { EmbedBuilder } from 'discord.js';

export const LinkEmbed = new EmbedBuilder()
.setTitle('Adquirir Mentoria')
.setDescription('Para adquirir a mentoria, clique no botão abaixo\n\nVocê tem 30 minutos para concluir a assinatura antes do link se expirar!')
.setThumbnail('https://i.ibb.co/MD6ZjbJB/Logo-Mentoria-Felipe.jpg')
.setColor('#058aff')
.setFooter({ text: 'Pagamento seguro via Stripe' })