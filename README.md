Here be dragons. This "single shot" Discord bot was created to post [Griphax](https://www.griphax.com/) race calendar to our Discord server. 

# What it does

- Eats a Google Calendar
- Constructs HTML document
- Puppeteer takes a screenshot of it
- Pushes it to a Discord channel

## Development Environment (Local)

So for some reason you want to use this code for your own purposes? Please go right ahead. 

### System Requirements

:bulb: Before you begin, make sure you have the following installed:

- [Node.js v16 or above](https://nodejs.org/en/download/)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git/)
- Optional: systemd is required to run the script periodically

### Getting Started With Local Development

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/TemeASD/griphax-discord-calendar.git
cd griphax-discord-calendar
npm install
```

2. Read the Google Calendarquick start for NodeJS 

All the code relating to the Calendar API was taken from [here](https://developers.google.com/calendar/api/quickstart/nodejs)

3. Create some config files

* `config.json` for Google Calendar. Steps can be found from previous step. 
* `discord-config.json` for Discord.JS

```json
{
  "client_secret": "",
  "client_id": "",
  "public_key": "",
  "token": "",
  "channel_id": "of the channel where you want to post your images"
}
```

4. Create systemd.service and systemd.timer unit files

### Timer

```ascii
[Unit]
Description=Runs script
Requires=ghaxCal.service

[Timer]
Unit=ghaxCal.service
OnCalendar=Mon *-*-* 10:00:00

[Install]
WantedBy=timers.target
```


### Service

```ascii
[Unit]
Description=Posts images to discord
Wants=ghaxcal.timer

[Service]
Type=oneshot
User=your username
ExecStart=sh path-to-repo/start.sh

[Install]
WantedBy=multi-user.target
```

### Enabling

If you have named the files as I did, you can use this. Otherwise use the name you used.  

```bash
systemctl enable ghaxCal.timer
```

### That's it. 

You can hopefully manage to read through the absolute garbage code in `index.js`. 

Key files: 

* `index.js` Almost all of the functionality happens in the "client.ready" event of DiscordJS 👾
* `assets\html\index.html` Here you can modify the appearances
