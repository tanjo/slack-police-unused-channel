const fs = require('fs');
const request = require('sync-request');
const config = require('./config');
const slep = require('./sleep');
const USERS_INFO_URL = 'https://slack.com/api/users.info?token=' + config.token + "&user=";
const CHANNELS_INFO_URL = 'https://slack.com/api/channels.info?token=' + config.token + '&channel='

const channelsInfo = (channel_id) => {
  return slack(CHANNELS_INFO_URL + channel_id);
}

const usersInfo = (user_id) => {
  return slack(USERS_INFO_URL + user_id);
}

const isExistFile = (file) => {
  try {
    fs.statSync(file);
    return true
  } catch(err) {
    if(err.code === 'ENOENT') return false
  }
}

const slack = (url) => {
  var response = request('GET', url);
  if (response.statusCode === 429) {
    console.log('\n[Sleep ' + (response.headers['retry-after'] + 1) + ']');
    sleep.sleepPromise(1 * (response.headers['retry-after'] + 1));
    response = request('GET', url);
  } else if (response.statusCode >= 300) {
    console.log('\n[Status Code: ' + response.statusCode + ']');
    response = { body: { ok: false } };
  }
  return response.getBody().toString();
}

const main = () => {

  var botChannels = [];

  if (!isExistFile('./bots.json')) {
    fs.writeFileSync('./bots.json', '{"bots":[]}');
  }
  if (!isExistFile('./app-users.json')) {
    fs.writeFileSync('./app-users.json', '{"app_users":[]}');
  }

  const data = require('./data.json');
  if (!data.ok) {
    throw 'データの取得に失敗しました'
  }

  var bots = new Set(JSON.parse(fs.readFileSync('./bots.json')).bots);
  var appUsers = new Set(JSON.parse(fs.readFileSync('./app-users.json')).app_users);

  data.channels.filter((channel) => channel.num_members < 5).forEach((channel, index) => {
    if (channel.is_channel) {
      process.stdout.write('[' + index + ']');

      const body = JSON.parse(channelsInfo(channel.id));
      if (body && body.ok && body.channel) {
        const channelInfo = body.channel;
        var is_bot_only = true;
        channelInfo.members.forEach((member) => {
          var body2 = JSON.parse(usersInfo(member));
          if (body2 && body2.ok && body2.user) {
            const user = body2.user;
            if (user.is_bot) {
              bots.add(user);
              return;
            }
            if (user.is_app_user) {
              appUsers.add(user);
              return;
            }
            is_bot_only = false;
          }
        });
        if (is_bot_only) {
          process.stdout.write(channelInfo.name);
          botChannels.push(channelInfo);
        }
      }
    }
  });

  console.log('\nfin.');

  console.log('\n\n[bot]')

  Array.from(bots).map((bot) => '@' + bot.name + ' ' + bot.real_name).forEach((name) => {
    console.log(name);
  });

  console.log('\n\n[App User]')

  Array.from(appUsers).map((app_user) => '@' + app_user.name + ' ' + app_user.real_name).forEach((name) => {
    console.log(name);
  });

  fs.appendwriteFileSyncFileSync('./result-bot.txt', JSON.stringify({results: botChannels}));
  fs.writeFileSync('./bots.json', JSON.stringify({bots: Array.from(bots)}));
  fs.writeFileSync('./app-users.json', JSON.stringify({app_users: Array.from(appUsers)}));
};

main();
