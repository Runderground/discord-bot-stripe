"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentInfoEmbed = void 0;
const discord_js_1 = require("discord.js");
exports.PaymentInfoEmbed = new discord_js_1.EmbedBuilder()
    .setTitle('✅ Mentoria Assinada')
    .setTimestamp()
    .setColor('#9effa6')
    .setFooter({ text: 'Uma nova compra foi processada!' });
