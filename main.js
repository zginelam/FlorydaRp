require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ID
const CHANNEL_ID = '1490792654743797770';
const ROLE_ID = '1432734559975510127';

// Tworzenie klienta
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 📌 KOMENDA
const commands = [
    new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Panel do rzeczy')
        .addSubcommand(sub =>
            sub
                .setName('weryfikacja')
                .setDescription('Wyślij panel weryfikacji')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .toJSON()
];

// 📌 DEPLOY + STATUS
client.once('ready', async () => {
    console.log(`Zalogowano jako ${client.user.tag}`);

    // 🔥 STATUS BOTA
    client.user.setPresence({
        activities: [{
            name: 'FlorydaRP',
            type: 0
        }],
        status: 'dnd'
    });

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log('Komendy zarejestrowane!');
    } catch (err) {
        console.error(err);
    }
});

// 📌 PYTANIA
const questions = [
    { q: "11+9", a: "20" },
    { q: "1+1", a: "2" },
    { q: "2+8", a: "10" },
    { q: "7-2", a: "5" }
];

// 📌 OBSŁUGA INTERAKCJI
client.on('interactionCreate', async interaction => {

    // SLASH COMMAND
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'panel') {

            if (interaction.options.getSubcommand() === 'weryfikacja') {

                const embed = new EmbedBuilder()
                    .setTitle('Weryfikacja FlorydaRP')
                    .setDescription('Aby się zweryfikować i otrzymać pełen dostęp do serwera, proszę kliknij poniższy przycisk.')
                    .setColor('#2b2d31')
                    .setFooter({ text: 'FlorydaRP • System weryfikacji' });

                const button = new ButtonBuilder()
                    .setCustomId('verify_button')
                    .setLabel('Zweryfikuj się')
                    .setStyle(ButtonStyle.Success);

                const row = new ActionRowBuilder().addComponents(button);

                const channel = await client.channels.fetch(CHANNEL_ID);

                await channel.send({
                    embeds: [embed],
                    components: [row]
                });

                await interaction.reply({
                    content: '✅ Panel wysłany!',
                    ephemeral: true
                });
            }
        }
    }

    // KLIK PRZYCISKU
    if (interaction.isButton() && interaction.customId === 'verify_button') {

        // ❗ sprawdzenie czy już ma rolę
        if (interaction.member.roles.cache.has(ROLE_ID)) {
            return interaction.reply({
                content: '❌ Jesteś już zweryfikowany!',
                ephemeral: true
            });
        }

        const random = questions[Math.floor(Math.random() * questions.length)];

        const modal = new ModalBuilder()
            .setCustomId(`verify_${random.a}`)
            .setTitle('Weryfikacja');

        const input = new TextInputBuilder()
            .setCustomId('answer')
            .setLabel(`Ile to: ${random.q}?`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // ODPOWIEDŹ
    if (interaction.isModalSubmit() && interaction.customId.startsWith('verify_')) {

        const correct = interaction.customId.split('_')[1];
        const answer = interaction.fields.getTextInputValue('answer');

        if (answer === correct) {

            const role = interaction.guild.roles.cache.get(ROLE_ID);

            if (!role) {
                return interaction.reply({
                    content: '❌ Nie znaleziono roli!',
                    ephemeral: true
                });
            }

            await interaction.member.roles.add(role);

            await interaction.reply({
                content: '✅ Zweryfikowano! Otrzymałeś dostęp do serwera.',
                ephemeral: true
            });

        } else {
            await interaction.reply({
                content: '❌ Zła odpowiedź! Spróbuj ponownie.',
                ephemeral: true
            });
        }
    }
});

// 🔑 LOGOWANIE
client.login(TOKEN);