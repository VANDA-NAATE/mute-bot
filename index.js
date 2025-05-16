const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Replace these with real Discord user IDs
const allowedBotIDs = ['OTHER_BOT_ID_HERE'];      // ID of the bot sending the mute command
const allowedUserIDs = ['SERVER_OWNER_ID_HERE'];  // Server owner's Discord ID

const PREFIX = 't!';

client.on('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // Allow commands only from the allowed bot or server owner
  if (message.author.bot && !allowedBotIDs.includes(message.author.id)) return;
  if (!message.author.bot && !allowedUserIDs.includes(message.author.id)) return;

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'mute') {
    let userMention = message.mentions.users.first();

    // Fallback: manually extract user ID from mention
    if (!userMention && args[0]?.startsWith('<@') && args[0].endsWith('>')) {
      const userId = args[0].replace(/[<@!>]/g, '');
      try {
        const fetchedMember = await message.guild.members.fetch(userId);
        if (fetchedMember) {
          userMention = fetchedMember.user;
        }
      } catch {
        return message.reply('❌ Unable to fetch user from mention.');
      }
    }

    if (!userMention) {
      return message.reply('❌ Please mention a user to mute.');
    }

    const durationMinutes = parseInt(args[1]) || 5;

    const member = message.guild.members.cache.get(userMention.id);
    if (!member) {
      return message.reply('❌ Could not find that user in the server.');
    }

    // ✅ Avoid duplicate mutes
    if (member.communicationDisabledUntilTimestamp > Date.now()) {
      console.log(`${member.user.tag} is already muted.`);
      return;
    }

    try {
      await member.timeout(durationMinutes * 60 * 1000); // Discord timeout in ms
      message.channel.send(`🔇 ${userMention.tag} has been muted for ${durationMinutes} minutes.`);
    } catch (error) {
      console.error('Mute error:', error);
      message.reply('❌ I was unable to mute that user.');
    }
  }
});

client.login(process.env.TOKEN);
