const { Client } = require('discord.js-selfbot-v13');
const client = new Client(); // All partials are loaded automatically
const fs = require('fs');
const path = require('path');
const ChartJSImage = require('chart.js-image');
const Alpaca = require('@alpacahq/alpaca-trade-api')
require('dotenv').config();

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API,
  secretKey: process.env.ALPACA_SECRET,
  paper: true,
})

let gid = '1035426647966502952';
let cid = '1035426647966502955';
let g = null;
let c = null;

let lbal = 0;
let balance = 0;
let in_bank = 0;

let beg_interval = null;
let crime_interval = null;
let work_interval = null;
let gamble_interval = null;

let cb = (c) => c.sendSlash('1027970017897218048', 'balance')
let mb = (c) => c.sendSlash('1027970017897218048', 'beg')
let cb2 = (c) => c.sendSlash('1027970017897218048', 'crime')
let work = (c) => c.sendSlash('1027970017897218048', 'work')
let daily = (c) => c.sendSlash('1027970017897218048', 'daily')
let gamble = (c) => c.send('s!gamble lower 100')

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`);
  g = await client.guilds.fetch(gid);
  c = await g.channels.fetch(cid);
  c.send(`.\n\n\nSelfbot ready.`);
  c.send(`Fetching balance...`);
  await cb(c);
  await mb(c);
  await cb2(c);
  await work(c);
  await gamble(c);
  beg_interval = setInterval(async () => {
    console.log('Begged');
    await mb(c);
  }, 1000 * 11);
  crime_interval = setInterval(async () => {
    console.log('Crimes');
    await cb2(c);
  }, 1000 * 61);
  gamble_interval = setInterval(async () => {
    console.log('Gambled');
    await gamble(c);
  }, 1000 * 15);
  work_interval = setInterval(async () => {
    console.log('Worked');
    await work(c);
  }, 1000 * 60 * 31);
})

client.on('messageCreate', async (message) => {
  if (message.author.id == client.user.id) return;
  if (message.content.startsWith('!')) {
    let args = message.content.split(' ');
    let cmd = args.shift().slice(1);
    if (cmd == 'stop') {
      clearInterval(beg_interval);
      clearInterval(crime_interval);
      clearInterval(gamble_interval);
      message.channel.send('Stopped.');
    }else if(cmd == 'start') {
      beg_interval = setInterval(async () => {
        console.log('Begged');
        await mb(c);
      }, 11000);
      crime_interval = setInterval(async () => {
        console.log('Crimes');
        await cb2(c);
      }, 61000);
      gamble_interval = setInterval(async () => {
        console.log('Gambled');
        await gamble(c);
      }, 15000);
      work_interval = setInterval(async () => {
        console.log('Worked');
        await work(c);
      }, 1000 * 60 * 31);
      message.channel.send('Started.');
    }else if(cmd == 'balance') {
      await cb(message.channel);
    }else if(cmd == 'work') {
      await work(message.channel);
    }else if(cmd == 'daily') {
      await daily(message.channel);
    }else if(cmd == 'send') {
      c.sendSlash('1027970017897218048', 'send', '588686932918403072', balance);
    }else if(cmd == 'chart') {
      let data = fs.readFileSync(path.join(__dirname, 'log.txt'), 'utf8');
      let data2 = fs.readFileSync(path.join(__dirname, 'gamble.txt'), 'utf8');
      let lines = data.split('\n');
      let lines2 = data2.split('\n');
      let labels = [];
      let labels2 = [];
      let diffs = [];
      let diffs2 = [];
      let cash = [];
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line == '') continue;
        let info = line.split(' - ');
        labels.push(new Date(info[0]).toLocaleTimeString('cs-CZ'));
        diffs.push(info[1]);
        cash.push(info[2]);
      }
      for (let i = 0; i < lines2.length; i++) {
        let line = lines2[i];
        if (line == '') continue;
        let info = line.split(' - ');
        labels2.push(new Date(info[0]).toLocaleTimeString('cs-CZ'));
        diffs2.push(info[1]);
      }
      const line_chart1 = ChartJSImage().chart({
        "type": "line",
        "data": {
          "labels": labels,
          "datasets": [
            {
              "label": "Difference",
              "borderColor": "rgb(255,+99,+132)",
              "backgroundColor": "rgba(255,+99,+132,+.5)",
              "data": diffs
            }
          ]
        },
        "options": {
          "title": {
            "display": true,
            "text": "Balance history"
          },
          "scales": {
            "xAxes": [
              {
                "scaleLabel": {
                  "display": true,
                  "labelString": "Date"
                }
              }
            ],
            "yAxes": [
              {
                "stacked": true,
                "scaleLabel": {
                  "display": true,
                  "labelString": "Amount"
                }
              }
            ]
          }
        }
      }) // Line chart
      .backgroundColor('white')
      .width(1920) // 500px
      .height(1080); // 300px
      const line_chart2 = ChartJSImage().chart({
        "type": "line",
        "data": {
          "labels": labels,
          "datasets": [
            {
              "label": "Difference",
              "borderColor": "rgb(255,+99,+132)",
              "backgroundColor": "rgba(255,+99,+132,+.5)",
              "data": cash
            }
          ]
        },
        "options": {
          "title": {
            "display": true,
            "text": "Gamble history"
          },
          "scales": {
            "xAxes": [
              {
                "scaleLabel": {
                  "display": true,
                  "labelString": "Date"
                }
              }
            ],
            "yAxes": [
              {
                "stacked": true,
                "scaleLabel": {
                  "display": true,
                  "labelString": "Amount"
                }
              }
            ]
          }
        }
      }) // Line chart
      .backgroundColor('white')
      .width(1920) // 500px
      .height(1080); // 300px
      const line_chart3 = ChartJSImage().chart({
        "type": "line",
        "data": {
          "labels": labels2,
          "datasets": [
            {
              "label": "Difference",
              "borderColor": "rgb(255,+99,+132)",
              "backgroundColor": "rgba(255,+99,+132,+.5)",
              "data": diffs2
            }
          ]
        },
        "options": {
          "title": {
            "display": true,
            "text": "Gamble history"
          },
          "scales": {
            "xAxes": [
              {
                "scaleLabel": {
                  "display": true,
                  "labelString": "Date"
                }
              }
            ],
            "yAxes": [
              {
                "stacked": true,
                "scaleLabel": {
                  "display": true,
                  "labelString": "Amount"
                }
              }
            ]
          }
        }
      }) // Line chart
      .backgroundColor('white')
      .width(500) // 500px
      .height(300); // 300px
      c.sendTyping()
      line_chart1.toFile(path.join(__dirname, 'chart1.png'));
      line_chart2.toFile(path.join(__dirname, 'chart2.png'));
      line_chart3.toFile(path.join(__dirname, 'chart3.png'));
      setTimeout(() => {
        c.send({files: [path.join(__dirname, 'chart1.png'), path.join(__dirname, 'chart2.png'), path.join(__dirname, 'chart3.png')]});
      }, 2000)
    }
  }
  message.embeds.forEach(embed => {
    if (embed.title == 'ЯΛПDӨMDЦDΣ\'s balance') {
      balance = parseInt(embed.fields[0].value.split(' ')[0]);
      in_bank = parseInt(embed.fields[1].value.split(' ')[0]);
      if(lbal == 0) {
        lbal = balance;
      }else if(lbal != balance) {
        let diff = balance - lbal;
        lbal = balance;
        fs.appendFileSync(path.join(__dirname, 'log.txt'), `${new Date()} - ${diff} - ${balance} - ${in_bank}\n`);
      }
      if(balance + in_bank >= 100000) {
        clearInterval(beg_interval);
        c.send(`Balance: ${balance} | Bank: ${in_bank}`);
        c.send(`Stopping beg interval.`);
      }else {
        c.send(`Balance: ${embed.fields[0].value.split(' ')[0]}\nIn bank: ${embed.fields[1].value.split(' ')[0]}`);
      }
    }
    if(embed.title == "Working as Math Teacher") {
      let equation = embed.description.split('\n')[1].split('=')[0];
      let answer = eval(equation);
      let row = message.components[0].components;
      for(let i = 0; i < row.length; i++) {
        if(row[i].label == answer) {
          row[i].click(message);
        }
      }
    }
    if(embed.title.startsWith("You won 100")) {
      fs.appendFileSync(path.join(__dirname, 'gamble.txt'), `${new Date()} - ${50}\n`);
    }
    if(embed.title.startsWith("You lost 100")) {
      fs.appendFileSync(path.join(__dirname, 'gamble.txt'), `${new Date()} - ${-50}\n`);
    }
  })
})

client.login(process.env.TOKEN);