"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkEmbed = void 0;
const discord_js_1 = require("discord.js");
exports.LinkEmbed = new discord_js_1.EmbedBuilder()
    .setTitle('Adquirir Mentoria')
    .setDescription('Para adquirir a mentoria, clique no botão abaixo\n\nVocê tem 30 minutos para concluir a assinatura antes do link se expirar!')
    .setThumbnail('https://i.ibb.co/MD6ZjbJB/Logo-Mentoria-Felipe.jpg')
    .setColor('#058aff')
    .setFooter({ text: 'Pagamento seguro via Stripe' });
