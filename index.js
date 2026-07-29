const {
    Client, GatewayIntentBits, PermissionsBitField, ChannelType,
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder
} = require("discord.js");
require("dotenv").config();

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

const SEU_ID = process.env.SEU_ID;
const ID_DONO_AMIGO = process.env.ID_DONO_AMIGO;
const CATEGORIA_TICKET = process.env.CATEGORIA_TICKET;
const CARGO_STAFF = process.env.CARGO_STAFF;

client.once("ready", () => console.log(`✅ 🔥 ${client.user.tag} | Fogo Novo #100 ONLINE!`));

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.content.toLowerCase() === "!painel") {
        if (message.author.id !== SEU_ID && message.author.id !== ID_DONO_AMIGO)
            return message.reply("❌ Apenas os donos podem usar esse comando!");

        const painelEmbed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('🎫 Sistema de Tickets | Fogo Novo #100')
            .setDescription(`Bem-vindo ao sistema de tickets do Fogo Novo #100! 🔥

Este bot foi criado para oferecer um atendimento rápido, organizado e seguro.

O que você pode fazer:
* 🛒 Compras
* 💸 Vendas
* 🆘 Suporte
* 🤝 Parcerias
* ❗ Denúncias
* ❓ Dúvidas

Selecione a opção abaixo e aguarde.

⚠️ Não abra tickets sem necessidade. O uso indevido terá punições.

Obrigado por usar o atendimento do Fogo Novo #100!`)
            .setImage('https://cdn.discordapp.com/attachments/1518637940165705769/1531036105724395610/4CB55608-1D10-43A1-B689-5913B9667961.png?ex=6a67bffc&is=6a666e7c&hm=181750bad875b390de1a22c25d933317d44e032457d2cf5d9dcf5c26185f7647&');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_ticket')
                .setPlaceholder('📋 Selecione a opção desejada')
                .addOptions([
                    { label: '💳 Compras', value: 'compras' },
                    { label: '💰 Vendas', value: 'vendas' },
                    { label: '🆘 Suporte', value: 'suporte' },
                    { label: '🤝 Parcerias', value: 'parcerias' },
                    { label: '❗ Denúncias', value: 'denuncias' },
                    { label: '❓ Dúvidas', value: 'duvidas' }
                ])
        );

        await message.channel.send({ embeds: [painelEmbed], components: [menu] });
    }
});

client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
            // ✅ RESPOSTA INSTANTÂNEA — NÃO FICA PENSANDO
            await interaction.reply({ content: "🔄 Criando seu ticket...", ephemeral: true });

            const nomes = {
                compras: '💳 Compras', vendas: '💰 Vendas', suporte: '🆘 Suporte',
                parcerias: '🤝 Parcerias', denuncias: '❗ Denúncias', duvidas: '❓ Dúvidas'
            };
            const escolha = interaction.values[0];

            // Verifica ticket existente
            const existe = interaction.guild.channels.cache.find(c =>
                c.parentId === CATEGORIA_TICKET && c.topic === interaction.user.id
            );
            if (existe) return interaction.editReply({ content: `❌ Você já tem um ticket aberto: ${existe}` });

            // CRIA O CANAL — O MAIS RÁPIDO POSSÍVEL
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

            // Envia mensagem no ticket
            await canal.send({
                content: `# 🎫 Novo Ticket — ${nomes[escolha]}

👤 Usuário: <@${interaction.user.id}>
📌 Motivo: ${nomes[escolha]}

🔔 Aguardando atendimento...`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('atender').setLabel('👮 Atender').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
                )]
            });

            // Confirma na hora
            await interaction.editReply({ content: `✅ Ticket criado! ${canal}` });
        }

        // BOTÕES
        if (!interaction.isButton()) return;
        await interaction.deferUpdate();
        const eStaff = interaction.member.roles.cache.has(CARGO_STAFF);

        if (interaction.customId === 'atender') {
            if (!eStaff) return interaction.followUp({ content: "❌ Apenas a equipe!", ephemeral: true });
            await interaction.editReply({
                content: `# 👮 Ticket em Atendimento\n**Responsável:** ${interaction.user}`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('atender').setLabel(`✅ Atendido por ${interaction.user.username}`).setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
                )]
            });
        }

        if (interaction.customId === 'fechar') {
            if (!eStaff) return interaction.followUp({ content: "❌ Apenas a equipe!", ephemeral: true });
            await interaction.followUp({ content: "🔒 Fechando em 3s..." });
            setTimeout(() => interaction.channel.delete().catch(()=>{}), 3000);
        }

    } catch (erro) {
        console.error(erro);
        if (!interaction.replied && !interaction.deferred)
            interaction.reply({ content: "❌ Erro, tente novamente!", ephemeral: true }).catch(()=>{});
    }
});

client.login(process.env.TOKEN);
            
