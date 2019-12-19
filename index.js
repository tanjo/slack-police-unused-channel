const fs = require('fs');
const rp = require('request-promise');
const config = require('./config');
const sleep = require('./sleep.js');

const main = async () => {
  fs.writeFileSync('./data.json', await rp("https://slack.com/api/channels.list?token=" + config.token + "&exclude_archived=true&exclude_members=true"));

  const data = require('./data.json');

  if (!data.ok) {
    throw "データの取得に失敗しました.\nトークンまたは通信環境を確認してください.";
  }

  if (config.log) {
    console.log("All channels count = " + data.channels.length);
  }

  fs.writeFileSync('./result.txt', "" + data.channels.length + "\n");

  for (let i = 0; i < data.channels.length; i++) {
    process.stdout.write('.');
    const channel = data.channels[i];
    if (channel.is_channel) {
      const url = "https://slack.com/api/channels.history?token=" + config.token + "&channel=" + channel.id;
      var response = await rp(url).catch((err) => {
        switch (err.statusCode) {
          case 429:
            console.log('\n[Sleep ' + (response.headers['retry-after'] + 1) + ']');
            await sleep.sleep(1 * (response.headers['retry-after'] + 1));
            response = await rp(url);
            return response;
          default:
            console.log('\n[Status Code: ' + response.statusCode + ']');
            return null;
        }
      });
      if (!response) {
        console.log('[Error] response is empty.');
        return;
      }
      const body = JSON.parse(response);
      if (body && body.messages && body.messages.length !== 0) {
        const message = body.messages[0];
        if (message && message.type === "message") {
          const d = new Date(message.ts * 1000);
          const old = new Date(config.date);
          if (d.getTime() <= old.getTime()) {
            if (config.log) {
              console.log("\n" + i + " #" + channel.name);
            }
            fs.appendFileSync('./result.txt', i + " #" + channel.name + " @" + d.toLocaleString() + "\n");
          }
        } else {
          fs.appendFileSync('./result.txt', i + " #" + channel.name + " @UnknownType\n");
        }
      } else {
        fs.appendFileSync('./result.txt', i + " #" + channel.name + " @NoContent\n");
      }
    }
  }
  return null;
};

main();
