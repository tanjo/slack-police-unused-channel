# slack-police-unused-channel

## Setup

### Download

```
npm install
```

### config.json

一時的に使う場合、 token は[こちら](https://api.slack.com/custom-integrations/legacy-tokens)から取得できます。

```
{
  "token": "ここにトークン",
  "date": "2017/01/01",
  "log": false
}
```

## Run

```
node index.js
```

bot だけの部屋をリスト化する

```
node checkbot.js
```
