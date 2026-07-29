const {
    Client, GatewayIntentBits, PermissionsBitField, ChannelType,
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();

// ✅ Mantém o Render online sem erro de tempo
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('🔥 Fogo Novo Ticket | ONLINE!'));
app.listen(3000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= CONFIGURAÇÕES (TUDO NO .env) ================= //
const SEU_ID = process.env.SEU_ID;
const ID_DONO_AMIGO = process.env.ID_DONO_AMIGO;
const CATEGORIA_TICKET = process.env.CATEGORIA_TICKET;
const CARGO_STAFF = process.env.CARGO_STAFF;

client.once("ready", () => {
    console.log(`✅ 🔥 ${client.user.tag} | Fogo Novo #100 ONLINE!`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.toLowerCase() === "!painel") {
        if (message.author.id !== SEU_ID && message.author.id !== ID_DONO_AMIGO) {
            return message.reply("❌ Apenas os donos do servidor podem usar esse comando!");
        }

        const painelEmbed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('🎫 Sistema de Tickets | Fogo Novo #100')
            .setDescription(`Bem-vindo ao sistema de tickets do Fogo Novo #100! 🔥

Este bot foi criado para oferecer um atendimento rápido, organizado e seguro.

O que você pode fazer:
* 🛒 Abrir tickets de Compras.
* 💸 Abrir tickets de Vendas.
* 🆘 Solicitar Suporte.
* 🤝 Pedir Parcerias.
* 📢 Fazer Denúncias.
* ❓ Tirar Dúvidas.

Selecione a categoria desejada e aguarde um membro da equipe atendê-lo.

⚠️ Não abra tickets sem necessidade. O uso indevido do sistema poderá resultar em punições.

Obrigado por utilizar o sistema de atendimento do Fogo Novo #100!`)
            .setImage('https://cdn.discordapp.com/attachments/1518637940165705769/1531036105724395610/4CB55608-1D10-43A1-B689-5913B9667961.png?ex=6a67bffc&is=6a666e7c&hm=181750bad875b390de1a22c25d933317d44e032457d2cf5d9dcf5c26185f7647&');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_ticket')
                .setPlaceholder('📋 Selecione a opção desejada')
                .addOptions([
                    { label: '💳 Compras', value: 'compras', emoji: '💳' },
                    { label: '💰 Vendas', value: 'vendas', emoji: '💰' },
                    { label: '🆘 Suporte', value: 'suporte', emoji: '🆘' },
                    { label: '🤝 Parcerias', value: 'parcerias', emoji: '🤝' },
                    { label: '❗ Denúncias', value: 'denuncias', emoji: '❗' },
                    { label: '❓ Dúvidas', value: 'duvidas', emoji: '❓' }
                ])
        );

        await message.channel.send({ embeds: [painelEmbed], components: [menu] });
    }
});

client.on("interactionCreate", async (interaction) => {
    try {
        // 📋 MENU DE SELEÇÃO
        if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
            await interaction.deferUpdate(); // ✅ Responde rápido para não dar erro de tempo

            const valor = interaction.values[0];
            const nomes = {
                compras: '💳 Compras',
                vendas: '💰 Vendas',
                suporte: '🆘 Suporte',
                parcerias: '🤝 Parcerias',
                denuncias: '❗ Denúncias',
                duvidas: '❓ Dúvidas'
            };

            const existe = interaction.guild.channels.cache.find(c =>
                c.parentId === CATEGORIA_TICKET && c.topic === interaction.user.id
            );
            if (existe) {
                return interaction.followUp({ content: `❌ Você já tem um ticket aberto: ${existe}`, ephemeral: true });
            }

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CATEGORIA_TICKET,
                topic: interaction.user.id,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: CARGO_STAFF, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                ]
            });

            const botoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('atender').setLabel('👮 Atender').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
            );

            await canal.send({
                content: `# 🎫 Novo Ticket - ${nomes[valor]}

👤 Usuário: <@${interaction.user.id}>
📌 Motivo: ${nomes[valor]}

🔔 Aguardando atendimento da equipe...`,
                components: [botoes]
            });

            await interaction.followUp({ content: `✅ Ticket criado com sucesso! ${canal}`, ephemeral: true });
        }

        // 🎯 BOTÕES
        if (!interaction.isButton()) return;
        await interaction.deferUpdate(); // ✅ Também responde rápido

        const eStaff = interaction.member.roles.cache.has(CARGO_STAFF);

        if (interaction.customId === 'atender') {
            if (!eStaff) return interaction.followUp({ content: "❌ Apenas a equipe autorizada pode atender tickets!", ephemeral: true });

            const botoes = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('atender').setLabel(`✅ Atendido por ${interaction.user.username}`).setStyle(ButtonStyle.Success).setDisabled(true),
                new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
            );

            await interaction.editReply({
                content: `# 👮 Ticket em Atendimento

**Responsável:** ${interaction.user}

O atendimento foi assumido. Agradecemos a paciência!`,
                components: [botoes]
            });
        }

        if (interaction.customId === 'fechar') {
            if (!eStaff) return interaction.followUp({ content: "❌ Apenas a equipe autorizada pode fechar tickets!", ephemeral: true });
            await interaction.followUp({ content: "🔒 Este ticket será fechado em 3 segundos..." });
            setTimeout(() => interaction.channel.delete().catch(()=>{}), 3000);
        }

    } catch (erro) {
        console.error('ERRO:', erro);
        if (!interaction.replied && !interaction.deferred) {
            interaction.reply({ content: "❌ Ocorreu um erro, tente novamente ou avise a equipe!", ephemeral: true }).catch(()=>{});
        }
    }
});

client.login(process.env.TOKEN);
                            
