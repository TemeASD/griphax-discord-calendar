const fs = require('fs').promises;
const fs_sync = require('fs');
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const { Client, GatewayIntentBits, EmbedBuilder, MessageAttachment, italic } = require('discord.js');
const { token, channel_id } = require('./discord-config.json');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });


//html building
const html = fs_sync.readFileSync('./assets/html/index.html', { encoding: 'utf8', flag: 'r' });
const cheerio = require('cheerio');
const $ = cheerio.load(html);
$("#container").css("background-image", `url(../img/${Math.floor(Math.random() * (19 - 1 + 1) + 1)}.png)`);
const puppeteer = require('puppeteer');
const dateOptions = { hour12: false, month: "2-digit", day: "2-digit", year: "numeric" };
//discord
client.once('ready', async () => {
  let filenamedate = new Date()

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  console.log('Ready!');
  const channel = await client.channels.cache.get(channel_id);
  const events = await authorize().then(listEvents).catch(console.error);
  events.forEach(event => {
    const dateOptions = { hour12: false, month: "2-digit", day: "2-digit", year: "numeric" };
    const timeOptions = { hour12: false, hour: "numeric", minute: "numeric" }
    const startdate = new Date(event.start.dateTime);
    const enddate = new Date(event.end.dateTime);
    const textDate = startdate.toLocaleString("en-US", { weekday: 'long' });
    const isoDate = new Intl.DateTimeFormat("fi-FI", dateOptions).format(startdate);
    const isoStartTime = new Intl.DateTimeFormat("fi-FI", timeOptions).format(startdate);
    const isoEndTime = new Intl.DateTimeFormat("fi-FI", timeOptions).format(enddate);

    const UTCisoStartTime = new Intl.DateTimeFormat("fi-FI", { ...timeOptions, timeZone: "UTC" }).format(startdate);
    const UTCisoEndTime = new Intl.DateTimeFormat("fi-FI", { ...timeOptions, timeZone: "UTC" }).format(enddate);

    let row = `<tr><td class="bold">${textDate}<span>${isoDate}</span></td><td class="bold" >${UTCisoStartTime} - ${UTCisoEndTime} <span>UTC</span>${isoStartTime} - ${isoEndTime} <span>Europe/Helsinki</span></td><td class="bold">${event.summary}</td><td>${event.location}</td><td class="desc">${event.description}</td></tr>`;

    $('tbody').append(row);
  });
  fs_sync.writeFileSync("./assets/html/schedule.html", $.root().html(), { encoding: 'utf8', flag: 'w' });
  await page.goto("file:///home/devbox/griphax-discord-calendar/assets/html/schedule.html", { waitUntil: 'networkidle0' });
  await page.screenshot({
    path: `schedule-${new Intl.DateTimeFormat("fi-FI", dateOptions).format(filenamedate)}.jpg`
  });
  await browser.close();
  /*send image file to discord channel*/
  await channel.send({ files: [`schedule-${new Intl.DateTimeFormat("fi-FI", dateOptions).format(filenamedate)}.jpg`] }).catch(error => console.error(error));
  client.destroy();
});

function convertTz(tzstring, datetime) {
  return new Date(datetime.toLocaleString('fi-FI', { timeZone: tzstring }));
}
/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next weeks events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: '7dfad8734021b66a71830abe8ff9dacf4141757e0043a7051e4ea3889927b75c@group.calendar.google.com',
    timeMin: new Date().toISOString(),
    timeMax: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: 99,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }
  console.log(events)
  return events;
}

async function listCalendars(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.calendarList.list();
  const calendars = res.data.items;
  if (!calendars || calendars.length === 0) {
    console.log('No calendars found.');
    return;
  }
  console.log('Calendars:');
  calendars.map((calendar, i) => {
    console.log(`${calendar.id} - ${calendar}`);
  });
}
client.login(token);
