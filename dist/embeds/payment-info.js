"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentInfoEmbed = void 0;
const discord_js_1 = require("discord.js");
exports.PaymentInfoEmbed = new discord_js_1.EmbedBuilder()
    .setTitle('✅ Pontos de Decisão Assinado!')
    .setThumbnail('https://i.ibb.co/MD6ZjbJB/Logo-Mentoria-Felipe.jpg')
    .setTimestamp()
    .setColor('#9effa6')
    .setFooter({ text: 'Uma nova compra foi processada!' });
