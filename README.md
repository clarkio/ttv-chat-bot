# ttv-chat-bot
[![All Contributors](https://img.shields.io/badge/all_contributors-10-orange.svg?style=flat-square)](#contributors)

Twitch TV chat reader to change the color of overlays loaded from streamelements and/or colors of internet connected lights via Azure Bot Service and Language Understanding AI (LUIS)

> Join Clarkio live on Wednesdays at 10 AM ET and Fridays at 12:30 PM ET for the coding streams. https://twitch.tv/clarkio

## Getting Started

1. Clone with: `git clone git@github.com:clarkio/ttv-chat-bot.git`
1. Goto project: `cd ttv-chat-bot`
1. Install node dependencies: `npm install`
1. If on:
   * **Debian/Ubuntu** run: `sudo apt install mpg123`
   * **Windows** install: [cmdmp3](https://github.com/jimlawless/cmdmp3)
   * **MacOS** you should have [afplay](https://developer.apple.com/library/mac/documentation/Darwin/Reference/ManPages/man1/afplay.1.html) already available
1. Login on [https://twitch.tv](https://twitch.tv)
1. Go to [https://twitchapps.com/tmi/](https://twitchapps.com/tmi/)
   1. Click "Connect with Twitch"
   1. Click "Authorize"
   1. Copy the token value (starts with "oauth:")
1. Rename the file `.env-example` to `.env`
1. Update `TTV_CLIENT_TOKEN` with the token value you copied before in step 4.c
1. Update `TTV_CLIENT_USERNAME` to your client username (defaults to "clarkio")
1. For each overlay in streamelements (a.k.a. scenes) copy the URL to the scene and add it to the `.env` file as a new environment variable for each one.

   Example: mainScene=https://streamelements.com/overlay/abc/123

1. Get Streamelements JWT from your account and update `STREAMELEMENTS_JWT` in your `.env` file.

## Run the Application

Please make sure you've completed all steps in the "Getting Started" section before attempting to run the app.

### From Docker

- (@roberttables) Set OBS_SOCKETS_SERVER=host.docker.internal:<the port your OBS Websockets server is running>
  - (@parithon) Note This dns name (host.docker.internal) only appears to work on Docker Desktop for Mac/Windows and not production environments nor other linux environments (Ubuntu)
  - (@roberttables) In that case then you can use the override through docker0 bridge which exists in linux environments

#### Windows

#### MacOS

#### Linux

### From the Command Line (CLI)

1. Change to the directory of the project `ttv-chat-bot` if you have not already done so.
1. Run `npm start`
1. Open your browser and go to [http://localhost:1337/scenes?sceneName=<your-scene-name-from-.env>](http://localhost:1337/scenes?sceneName=)

   Example: [http://localhost:1337/scenes?sceneName=mainScene](http://localhost:1337/scenes?sceneName=mainScene)

### From VS Code

1. Go to the debugger view and confirm the debugger is set to "Server Start"
1. Press the "Start Debugging" button (the green play button)
1. Open your browser and go to [http://localhost:1337/scenes?sceneName=<your-scene-name-from-.env>](http://localhost:1337/scenes?sceneName=)

   Example: [http://localhost:1337/scenes?sceneName=mainScene](http://localhost:1337/scenes?sceneName=mainScene)

## Trying Things Out

Please make sure you've completed all steps in the "Getting Started" and "Run the Application" sections before attempting to try out the app.

1. Open up a new browser tab or window and navigate to the chat for the Twitch channel you want to use (defaults to "clarkio" in the `.env` file under `TTV_CHANNELS`)

   Example: [https://www.twitch.tv/popout/clarkio/chat](https://www.twitch.tv/popout/clarkio/chat)

   > If you'd like to have the client connect to another channel you can add it to the `TTV_CHANNELS` environment variable. The variable is comma-delimited so you can have it as clarkio,"your channel name" to connect to multiple channels

1. Enter the following chat message "!bulb go green" and you should see your overlay change color in your other tab/window which loaded [http://localhost:1337/scenes?sceneName=mainScene](http://localhost:1337/scenes?sceneName=mainScene)

   > WARNING: the implementation is currently based off of an overlay being blue by default and will alter the hue from that. If your overlay default color is different it will not exactly change to the color you may be intending. We are working on making this better to support different default overlay colors.

## Twitch Viewers that have helped contribute to the project (in no particular order):

Want to contribute? Check out our [Code of Conduct](CODE_OF_CONDUCT.md) and [Contributing](CONTRIBUTING.md) docs. This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.  Contributions of any kind welcome!

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

- sockelo
- [frenck](https://github.com/frenck)
- [tallpants](https://github.com/tallpants)
- wwsean08
- l2ival
- ikoakmaindehoas
- codephobia
- styler
- [TheMartesLive](https://github.com/TheMartes)
- [eeevans](https://github.com/eeevans)
- TheMichaelJolley
- @jaredpsimpson

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/jakegny"><img src="https://avatars2.githubusercontent.com/u/6787885?v=4" width="100px;" alt=""/><br /><sub><b>Jake Nylund</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=jakegny" title="Code">💻</a></td>
    <td align="center"><a href="https://michaeljolley.com/"><img src="https://avatars2.githubusercontent.com/u/1228996?v=4" width="100px;" alt=""/><br /><sub><b>Michael Jolley</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=MichaelJolley" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/CodemanCodes"><img src="https://avatars3.githubusercontent.com/u/46641880?v=4" width="100px;" alt=""/><br /><sub><b>CodemanCodes</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=CodemanCodes" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jaredpsimpson"><img src="https://avatars0.githubusercontent.com/u/1933150?v=4" width="100px;" alt=""/><br /><sub><b>jaredpsimpson</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=jaredpsimpson" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/eeevans"><img src="https://avatars1.githubusercontent.com/u/272717?v=4" width="100px;" alt=""/><br /><sub><b>Edward Evans</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=eeevans" title="Code">💻</a></td>
    <td align="center"><a href="https://nmarch213.github.io/Portfolio/"><img src="https://avatars1.githubusercontent.com/u/14193159?v=4" width="100px;" alt=""/><br /><sub><b>Nicholas March</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=nmarch213" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/PatPat1567"><img src="https://avatars0.githubusercontent.com/u/41209202?v=4" width="100px;" alt=""/><br /><sub><b>PatPat1567</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/issues?q=author%3APatPat1567" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://timmykokke.com"><img src="https://avatars1.githubusercontent.com/u/2283621?v=4" width="100px;" alt=""/><br /><sub><b>Timmy Kokke</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=sorskoot" title="Code">💻</a></td>
    <td align="center"><a href="https://www.mcduboiswebservices.com"><img src="https://avatars0.githubusercontent.com/u/39778093?v=4" width="100px;" alt=""/><br /><sub><b>Michael duBois</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=MichaelCduBois" title="Code">💻</a></td>
    <td align="center"><a href="https://lannonbr.com"><img src="https://avatars2.githubusercontent.com/u/3685876?v=4" width="100px;" alt=""/><br /><sub><b>Benjamin Lannon</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=lannonbr" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/OiYouYeahYou"><img src="https://avatars2.githubusercontent.com/u/20130059?v=4" width="100px;" alt=""/><br /><sub><b>Jason Allan</b></sub></a><br /><a href="https://github.com/clarkio/ttv-chat-bot/commits?author=OiYouYeahYou" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Wingysam"><img src="https://avatars3.githubusercontent.com/u/18403742?v=4" width="100px;" alt=""/><br /><sub><b>Wingysam</b></sub></a><br /><a href="#ideas-Wingysam" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
