const {
    Client, GatewayIntentBits, PermissionsBitField, ChannelType,
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle
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
let CONFIG = {
    categoria: process.env.CATEGORIA_TICKET || null,
    cargoStaff: process.env.CARGO_STAFF || null,
    canalLogs: null,
    descricaoPersonalizada: null,
    imagemPersonalizada: 'https://cdn.discordapp.com/attachments/1518637940165705769/1531036105724395610/4CB55608-1D10-43A1-B689-5913B9667961.png?ex=6a67bffc&is=6a666e7c&hm=181750bad875b390de1a22c25d933317d44e032457d2cf5d9dcf5c26185f7647&'
};

client.once("ready", () => console.log(`✅ 🔥 ${client.user.tag} | Fogo Novo #100 ONLINE!`));

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.content.toLowerCase() === "!painel") {
        if (message.author.id !== SEU_ID && message.author.id !== ID_DONO_AMIGO)
            return message.reply("❌ Apenas os donos podem usar esse comando!");

        const embConfig = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('⚙️ Configuração do Sistema de Tickets')
            .setDescription(`Configure tudo como quiser:

📝 **Descrição + Imagem**
Altere o texto e a imagem do painel principal.

👥 **Cargos + Categoria**
Defina onde os tickets serão criados e quem pode atender.

📋 **Sistema de Logs**
Escolha um canal para registrar todas as ações.

📤 **Enviar Painel**
Após configurar tudo, clique aqui para enviar o painel de atendimento.

⚠️ Apenas os donos podem alterar essas configurações.`);

        const menuConfig = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('menu_config')
                .setPlaceholder('🔧 Escolha o que deseja configurar')
                .addOptions([
                    { label: '📝 Descrição + Imagem', value: 'descricao_imagem', emoji: '📝' },
                    { label: '👥 Cargos + Categoria', value: 'cargo_categoria', emoji: '👥' },
                    { label: '📋 Sistema de Logs', value: 'logs', emoji: '📋' },
                    { label: '📤 Enviar Painel', value: 'enviar_painel', emoji: '📤' }
                ])
        );

        await message.channel.send({ embeds: [embConfig], components: [menuConfig] });
    }
});

client.on("interactionCreate", async (interaction) => {
    try {
        // 🎛️ MENU DE CONFIGURAÇÃO
        if (interaction.isStringSelectMenu() && interaction.customId === 'menu_config') {
            const opcao = interaction.values[0];

            if (opcao === 'descricao_imagem') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_descricao')
                    .setTitle('📝 Descrição e Imagem')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('texto').setLabel('Texto do Painel').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Deixe em branco para usar o padrão.')
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('imagem').setLabel('Link da Imagem').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('Link direto da imagem.')
                        )
                    );
                return interaction.showModal(modal);
            }

            if (opcao === 'cargo_categoria') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_cargos')
                    .setTitle('👥 Categoria e Cargos')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('categoria').setLabel('ID da Categoria').setStyle(TextInputStyle.Short).setRequired(true).setValue(CONFIG.categoria || '')
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('staff').setLabel('ID do Cargo Staff').setStyle(TextInputStyle.Short).setRequired(true).setValue(CONFIG.cargoStaff || '')
                        )
                    );
                return interaction.showModal(modal);
            }

            if (opcao === 'logs') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_logs')
                    .setTitle('📋 Canal de Logs')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder().setCustomId('canal').setLabel('ID do Canal de Logs').setStyle(TextInputStyle.Short).setRequired(false).setValue(CONFIG.canalLogs || '')
                        )
                    );
                return interaction.showModal(modal);
            }

            if (opcao === 'enviar_painel') {
                await interaction.deferReply({ ephemeral: true });
                if (!CONFIG.categoria || !CONFIG.cargoStaff) {
                    return interaction.editReply({ content: "⚠️ O sistema ainda não foi configurado!\nPeça para um administrador configurar primeiro ou aguarde." });
                }

                const textoFinal = CONFIG.descricaoPersonalizada || `Bem-vindo ao sistema de tickets do Fogo Novo #100! 🔥

Este bot foi criado para oferecer um atendimento rápido, organizado e seguro.

O que você pode fazer:
* 🛒 Abrir tickets de Compras.
* 💸 Abrir tickets de Vendas.
* 🆘 Solicitar Suporte.
* 🤝 Pedir Parcerias.
* 📢 Fazer Denúncias.
* ❓ Tirar Dúvidas.

Selecione a opção desejada e aguarde.

⚠️ Não abra tickets sem necessidade. O uso indevido terá punições.`;

                const painelFinal = new EmbedBuilder()
                    .setColor('#FF4500')
                    .setTitle('🎫 Sistema de Tickets | Fogo Novo #100')
                    .setDescription(textoFinal)
                    .setImage(CONFIG.imagemPersonalizada);

                const menuTicket = new ActionRowBuilder().addComponents(
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

                await interaction.channel.send({ embeds: [painelFinal], components: [menuTicket] });
                return interaction.editReply({ content: "✅ Painel enviado com sucesso!" });
            }
        }

        // 📝 SALVA AS CONFIGURAÇÕES
        if (interaction.isModalSubmit()) {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.customId === 'modal_descricao') {
                CONFIG.descricaoPersonalizada = interaction.fields.getTextInputValue('texto') || null;
                const img = interaction.fields.getTextInputValue('imagem');
                if(img) CONFIG.imagemPersonalizada = img;
                return interaction.editReply({ content: "✅ Descrição e imagem salvas!" });
            }

            if (interaction.customId === 'modal_cargos') {
                CONFIG.categoria = interaction.fields.getTextInputValue('categoria');
                CONFIG.cargoStaff = interaction.fields.getTextInputValue('staff');
                return interaction.editReply({ content: "✅ Categoria e cargos salvos!" });
            }

            if (interaction.customId === 'modal_logs') {
                CONFIG.canalLogs = interaction.fields.getTextInputValue('canal') || null;
                return interaction.editReply({ content: "✅ Canal de logs salvo!" });
            }
        }

        // 🎫 CRIAÇÃO DO TICKET — AGORA MARCA O CARGO E AVISA SE NÃO CONFIGURADO
        if (interaction.isStringSelectMenu() && interaction.customId === 'menu_ticket') {
            await interaction.reply({ content: "🔄 Criando seu ticket...", ephemeral: true });

            // ✅ AVISA SE NÃO CONFIGUROU AINDA
            if (!CONFIG.categoria || !CONFIG.cargoStaff) {
                return interaction.editReply({ content: "⚠️ O sistema ainda não foi configurado!\nPeça para um administrador configurar primeiro ou aguarde." });
            }

            const nomes = {
                compras: '💳 Compras', vendas: '💰 Vendas', suporte: '🆘 Suporte',
                parcerias: '🤝 Parcerias', denuncias: '❗ Denúncias', duvidas: '❓ Dúvidas'
            };
            const escolha = interaction.values[0];

            const existe = interaction.guild.channels.cache.find(c =>
                c.parentId === CONFIG.categoria && c.topic === interaction.user.id
            );
            if (existe) return interaction.editReply({ content: `❌ Você já tem um ticket aberto: ${existe}` });

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: CONFIG.categoria,
                topic: interaction.user.id,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                    { id: CONFIG.cargoStaff, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                ]
            });

            // ✅ AGORA MARCA O CARGO DA STAFF NA MENSAGEM
            await canal.send({
                content: `# 🎫 Novo Ticket — ${nomes[escolha]}

👤 Usuário: <@${interaction.user.id}>
📌 Motivo: ${nomes[escolha]}
🔔 Equipe: <@&${CONFIG.cargoStaff}>

Aguardando atendimento...`,
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('atender').setLabel('👮 Atender').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('fechar').setLabel('🔒 Fechar').setStyle(ButtonStyle.Danger)
                )]
            });

            await interaction.editReply({ content: `✅ Ticket criado! ${canal}` });
        }

        // 🎯 BOTÕES
        if (!interaction.isButton()) return;
        await interaction.deferUpdate();
        const eStaff = interaction.member.roles.cache.has(CONFIG.cargoStaff);

        if (interaction.customId === 'atender') {
            if (!eStaff) return interaction.followUp({ content: "❌ Apenas a equipe!", ephemeral: true });
            await interaction.editReply({
                content: `# 👮 Ticket em Atendimento\n**Responsável:** ${interaction.user}\n🔔 Equipe: <@&${CONFIG.cargoStaff}>`,
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
                    
