var fs = require('fs');
var request = require('sync-request');
var config = require('./config');

fs.writeFileSync('./data.json', request('GET', "https://slack.com/api/channels.list?token=" + config.token + "&exclude_archived=true").getBody().toString());

var data = require('./data.json');

if (!data.ok) {
  throw "データの取得に失敗しました.\nトークンまたは通信環境を確認してください.";
}

if (console.log) {
  console.log("All channels count = " + data.channels.length);
}

fs.writeFileSync('./result.txt', "" + data.channels.length + "\n");

for (var i = 0; i < data.channels.length; i++) {
  var channel = data.channels[i];
  if (channel.is_channel) {
    var url = "https://slack.com/api/channels.history?token=" + config.token + "&channel=" + channel.id;
    var response = request('GET', url);
    var body = JSON.parse(response.getBody().toString());
    if (body && body.messages && body.messages.length !== 0) {
      var message = body.messages[0];
      if (message && message.type === "message") {
        var d = new Date(message.ts * 1000);
        var d20161231 = new Date(config.date);
        if (d.getTime() <= d20161231.getTime()) {
          if (config.log) {
            console.log("" + i + " #" + channel.name);
          }
          fs.appendFile('./result.txt', i + " #" + channel.name + " @" + d.toLocaleString() + "\n");
        }
      } else {
        fs.appendFile('./result.txt', i + " #" + channel.name + " @UnknownType\n");
      }
    } else {
      fs.appendFile('./result.txt', i + " #" + channel.name + " @NoContent\n");
    }
  }
}
