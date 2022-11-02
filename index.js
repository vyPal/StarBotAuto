const { Client } = require('discord.js-selfbot-v13');
const client = new Client(); // All partials are loaded automatically
const fs = require('fs');
const path = require('path');
const Alpaca = require('@alpacahq/alpaca-trade-api')
require('dotenv').config();
const { EventEmitter } = require('events');
const ms = require('ms');

class EventLoop extends EventEmitter {}
let e = new EventLoop();

const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API,
  secretKey: process.env.ALPACA_SECRET,
  paper: true,
})

const guild_id = '1035426647966502952';
const channel_id = '1035426647966502955';
let guild = null;
let channel = null;

let last_balance = 0;
let balance = 0;
let in_bank = 0;

let sendSlash = (command, ...options) => channel.sendSlash('1027970017897218048', command, ...options);
let beg = () => {last_cmd='begging';sendSlash('beg')};
let crime = () => {last_cmd='crime';sendSlash('crime')};
let work = () => {sendSlash('work')};
let daily = () => {sendSlash('daily')};
let balance_check = () => {sendSlash('balance')};
let gamble = (guess, amount) => {last_cmd='gamble';sendSlash('gamble', guess, amount)};

let last_cmd = "";

let gamble_fails = 0;

let check_message = (message) => {
  let to_return = {
    beg: false,
    crime: false,
    work: false,
    daily: false,
    gamble: false
  }
  if (message.embeds.length > 0) {
    let embed = message.embeds[0];
    if(embed.title == 'ЯΛПDӨMDЦDΣ\'s balance') {
      balance = embed.fields[0].value;
      in_bank = embed.fields[1].value;
      e.emit('balance', balance);
    }else if(embed.title == 'Begging') {
      to_return.beg = true;
    }else if(embed.title == 'Crime') {
      to_return.crime = true;
    }else if(embed.title == 'Working as Math Teacher') {
      to_return.work = true;
    }else if(embed.title == 'Daily reward' || embed.title == 'You already claimed your daily reward today!') {
      to_return.daily = true;
    }else if(embed.title.startsWith('You won') || embed.title.startsWith('You lost') || embed.title.startsWith('It\'s a tie')) {
      to_return.gamble = true;
    }
  }else {
    if(message.content.startsWith("Please wait")) {
      let split = message.content.split(' ');
      let minutes = parseInt(split[2].replaceAll('`', ''));
      let seconds = parseInt(split[5]);
      e.emit(`${message.interaction.commandName}_stop`, `cooldown_${minutes}_${seconds}`);
    }
  }
  return to_return;
}

let handle_begging = (message) => {
  let embed = message.embeds[0];
  if(embed.description == 'You already have enough money!') {
    return e.emit('begging_stop', 'max_balance');
  }
  if(embed.description.startsWith('Please wait')) {
    let split = embed.description.split(' ');
    let minutes = parseInt(split[2].replaceAll('`', ''));
    let seconds = parseInt(split[5]);
    return e.emit('begging_stop', `cooldown_${minutes}_${seconds}`);
  }
  let amount = embed.description.match(/\d+/g)[0];
  balance += parseInt(amount);
  e.emit('beg', amount);
}

let handle_crime = (message) => {
  let embed = message.embeds[0];
  if(embed.description.startsWith('Please wait')) {
    let split = embed.description.split(' ');
    let minutes = parseInt(split[2].replaceAll('`', ''));
    let seconds = parseInt(split[5]);
    return e.emit('crime_stop', `cooldown_${minutes}_${seconds}`);
  }
  let amount = embed.description.match(/\d+/g)[0];
  if(embed.description.startsWith('You got caught')) {
    balance -= parseInt(amount);
    e.emit('crime', `caught_${amount}`);
  }else {
    balance += parseInt(amount);
    e.emit('crime', amount);
  }
}

let handle_work = (message) => {
  let embed = message.embeds[0];
  if(embed.description.startsWith('Please wait')) {
    let split = embed.description.split(' ');
    let minutes = parseInt(split[2].replaceAll('`', ''));
    let seconds = parseInt(split[5]);
    return e.emit('work_stop', `cooldown_${minutes}_${seconds}`);
  }
  let equation = embed.description.split('\n')[1].split('=')[0];
  let answer = eval(equation);
  let row = message.components[0].components;
  for(let i = 0; i < row.length; i++) {
    if(row[i].label == answer) {
      row[i].click(message);
    }
  }
}

let handle_work_final = (message) => {
  if(message.embeds[0].title.startsWith('Great work!')) {
    let amount = message.embeds[0].title.match(/\d+/g)[0];
    balance += parseInt(amount);
    e.emit('work', amount);
  }
}

let handle_daily = (message) => {
  if(message.embeds[0].title == 'Daily reward') {
    let amount = message.embeds[0].description.match(/\d+/g)[0];
    balance += parseInt(amount);
    e.emit('daily', amount);
  }else {
    let timestamp = message.embeds[0].timestamp;
    return e.emit('daily_claimed', `wait_${timestamp}`);
  }
}

let handle_gamble = (message) => {
  let embed = message.embeds[0];
  if(embed.description.startsWith('Please wait')) {
    let split = embed.description.split(' ');
    let minutes = parseInt(split[2].replaceAll('`', ''));
    let seconds = parseInt(split[5]);
    return e.emit('gamble_stop', `cooldown_${minutes}_${seconds}`);
  }
  let amount = embed.description.match(/\d+/g)[0];
  if(embed.title.startsWith('You won')) {
    balance += parseInt(amount);
    e.emit('gamble', amount);
  }else if(embed.title.startsWith('You lost')) {
    balance -= parseInt(amount);
    e.emit('gamble', `lost_${amount}`);
  }else {
    e.emit('gamble', 'tie');
  }
}

client.on('messageCreate', (message) => {
  if(message.channel.id == channel_id) {
    let check = check_message(message);
    if(check.beg) {
      handle_begging(message);
    }else if(check.crime) {
      handle_crime(message);
    }else if(check.work) {
      handle_work(message);
    }else if(check.daily) {
      handle_daily(message);
    }else if(check.gamble) {
      handle_gamble(message);
    }
  }
  if(message.embeds[0]?.title == 'Review your PURCHASE order') {
    message.components[0].components[0].click(message);
  }
})

client.on('messageUpdate', (oldmessage, newmessage) => {
  if(oldmessage.channel.id == channel_id) {
    if(oldmessage.embeds[0]?.title == "Working as Math Teacher") {
      handle_work_final(newmessage);
    }
  }
})

client.on('ready', async () => {
  console.log('Bot is ready!');
  guild = await client.guilds.fetch(guild_id);
  channel = await guild.channels.fetch(channel_id);
  balance_check();
})

e.once('balance', (balance) => {
  console.log(`Balance: ${balance}`);
  daily();
  setTimeout(crime, 1000 * 2.5)
  setTimeout(work, 1000 * 5)
  setTimeout(beg, 1000)
  gamble_ai();
})

e.once('daily_claimed', (timestamp) => {
  let split = timestamp.split('_');
  let wait = parseInt(split[1]);
  let date = new Date(wait);
  let now = new Date();
  let diff = date - now;
  console.log(`Daily claimed, waiting ${ms(diff)}`);
  setTimeout(daily, diff);
})

e.once('begging_stop', (reason) => {
  if(reason == 'max_balance') {
    console.log('Max balance reached, stopping begging');
    return;
  }
  let split = reason.split('_');
  let minutes = parseInt(split[1]);
  let seconds = parseInt(split[2].replaceAll('`', ''));
  let wait = (minutes * 60 + seconds) * 1000;
  console.log(`Begging stopped, waiting ${ms(wait)}`);
  setTimeout(beg, wait);
})

e.once('crime_stop', (reason) => {
  let split = reason.split('_');
  let minutes = parseInt(split[1]);
  let seconds = parseInt(split[2].replaceAll('`', ''));
  let wait = (minutes * 60 + seconds) * 1000;
  console.log(`Crime stopped, waiting ${ms(wait)}`);
  setTimeout(crime, wait);
})

e.once('work_stop', (reason) => {
  let split = reason.split('_');
  let minutes = parseInt(split[1]);
  let seconds = parseInt(split[2].replaceAll('`', ''));
  let wait = (minutes * 60 + seconds) * 1000;
  console.log(`Work stopped, waiting ${ms(wait)}`);
  setTimeout(work, wait);
})

e.once('gamble_stop', (reason) => {
  let split = reason.split('_');
  let minutes = parseInt(split[1]);
  let seconds = parseInt(split[2].replaceAll('`', ''));
  let wait = (minutes * 60 + seconds) * 1000;
  console.log(`Gamble stopped, waiting ${ms(wait)}`);
  setTimeout(gamble_ai, wait);
})

e.on('beg', (amount) => {
  console.log(`Begged and got ${amount}`);
  setTimeout(beg, 1000);
})

e.on('crime', (amount) => {
  let split = amount.split('_');
  if(amount.startsWith('caught_')) {
    console.log(`Got caught and lost ${split[1]}`);
  }else {
    console.log(`Commited a crime and got ${amount}`);
  }
  setTimeout(crime, 1000 * 60);
})

e.on('work', (amount) => {
  console.log(`Worked and got ${amount}`);
  setTimeout(work, 1000 * 60 * 30);
})

e.on('daily', (amount) => {
  console.log(`Claimed daily and got ${amount}`);
  setTimeout(daily, 1000 * 60 * 60 * 24);
})

e.on('gamble', (amount) => {
  if(amount == 'tie') {
    console.log('Tied');
  }else if(amount.startsWith('lost_')) {
    let split = amount.split('_');
    let lost = split[1];
    console.log(`Lost ${lost}`);
    gamble_fails++;
  }else {
    console.log(`Won ${amount}`);
  }
})

function gamble_ai() {
  if(gamble_fails >= 3) {
    gamble_fails = 0;
    setTimeout(gamble_ai, 1000 * 60 * 2);
  }
  if(balance<5_000) {
    gamble('lower', 100);
  }else if(balance<10_000) {
    gamble('lower', 500);
  }else if(balance<50_000) {
    gamble('lower', 1_000);
  }else if(balance<100_000) {
    gamble('lower', 5_000);
  }else if(balance<500_000) {
    gamble('lower', 10_000);
  }else if(balance<1_000_000) {
    gamble('lower', 50_000);
  }
  setTimeout(gamble_ai, 1000 * 15);
}

client.login(process.env.TOKEN)