const googleSheet = require('./services/googleSheet');
require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.DISCORD_TOKEN;

let discordBotDetailsSheet,
  userDetailsSheet,
  joinMessage,
  roleId,
  channelId,
  enabledYN,
  disableMessage;

const askMoreDetails = [
  {
    message: 'Enter your Full Name please? Only real name will be entertained.Names like 007 will be thrown out of the group?',
    pattern: /^[a-zA-Z ]{2,30}$/,
    errorMessage: 'Please enter a valid full name and type join command again in bot channel to start verification process again.',
  },
  {
    message: 'Enter your Phone number please?',
    pattern: /^[6-9][0-9]{9}$/,
    errorMessage: 'Please enter a valid phone number and type join command again in bot channel to start verification process again.',
  },
];

(async () => {
  discordBotDetailsSheet = await googleSheet.discordBotDetailsSheet();
  userDetailsSheet = await googleSheet.userDetailsSheet();
  joinMessage = `!join-${discordBotDetailsSheet.Clan.value}`;
  roleId = discordBotDetailsSheet['Role Id'].value;
  channelId = discordBotDetailsSheet['ChannelID'].value;
  enabledYN = discordBotDetailsSheet['Enabled/Disabled'].value;
  disableMessage = 'Sorry admissions have been closed';
})();

if (enabledYN === 'Yes' || enabledYN === 'yes') enabledYN = true;
else enabledYN = false;

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async (message) => {
  if (enabledYN) {
    if (message.member && message.member.roles.has(roleId) && message.content === joinMessage) {
      message.reply(`Please check your DM to verify the id?`);

      let sendMessageToUser = await message.author.send('Please provide your email id?');

      try {
        let collected = await sendMessageToUser.channel.awaitMessages((response) => response.content,
          {
            max: 1,
            time: 300000, // 5 minutes in milliseconds
            errors: ['time'],
          }
        );

        if (collected.first().content) {
          let inputEmailId = collected.first().content;

          let emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

          if (inputEmailId && !emailPattern.test(inputEmailId)) {
            message.author.send(`Please enter a valid email address and type join command again in bot channel to start verification process again.`);
          } else {
            let emailIdMatched = false;

            for (let user of userDetailsSheet) {
              let userIDFromSheet = user['Email address'].value;

              if (userIDFromSheet === inputEmailId) emailIdMatched = true;
            }

            if (emailIdMatched) {
              let detailArr = [];

              try {
                for (let moreDetail of askMoreDetails) {
                  await moreDetails(message, moreDetail, detailArr);
                }

                if (detailArr.length === askMoreDetails.length) {
                  message.author.send(`Please give me a minute I am checking out your details`);

                  setTimeout(() => {
                    message.author.send(`Welcome to the clan. Now you can move to :rocket: ${discordBotDetailsSheet.Clan.value} and start discussion there`);

                    bot.channels.get(channelId).send(`Welcome to the clan ${message.author.toString()}`);
                  }, 1700);
                }
              } catch (err) {
                message.author.send(err);
              }
            } else {
              message.author.send(`Sorry this email is not registerd with us. Please enter a valid email address with which you registered and type join command again in bot channel to start verification process again.`);
            }
          }
        }
      } catch (err) {
        console.log(err);
        message.author.send('Request Timed out because you did not responded in time from local discord bot');
      }
    }
  } else {
    message.reply(disableMessage);
  }
});

const moreDetails = async (message, moreDetail, detailArr) => {
  let sendMessageToUser = await message.author.send(moreDetail.message);

  try {
    let collected = await sendMessageToUser.channel.awaitMessages((response) => response.content,
      {
        max: 1,
        time: 300000, // 5 minutes in milliseconds
        errors: ['time'],
      }
    );

    if (collected.first().content) {
      let inputData = collected.first().content;

      let patternValidation = moreDetail.pattern;

      if (inputData && patternValidation.test(inputData)) {
        return detailArr.push(inputData);
      } else {
        return message.author.send(moreDetail.errorMessage);
      }
    }
  } catch (err) {
    return message.author.send('Request Timed out because you did not responded in time from local discord bot');
  }
};
