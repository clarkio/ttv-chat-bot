# ttv-chat-light

Twitch TV chat reader to change the color of overlays loaded from streamelements and/or colors of internet connected lights via Azure Bot Service and Language Understanding AI (LUIS)

## Getting Started

1. git pull git@github.com:clarkio/ttv-chat-light.git
2. cd `ttv-chat-light`
3. npm install
4. Login on [https://twitch.tv](https://twitch.tv)
5. Go to [https://twitchapps.com/tmi/](https://twitchapps.com/tmi/)
   1. Click "Connect with Twitch"
   2. Click "Authorize"
   3. Copy the token value (starts with "oauth:")
6. Rename the file `.env-example` to `.env`
7. Update `TTV_CLIENT_TOKEN` with the token value you copied before in step 4.c
8. Update `TTV_CLIENT_USERNAME` to your client username (defaults to "clarkio")
9. For each overlay in streamelements (a.k.a. scenes) copy the URL to the scene and add it to the `.env` file as a new environment variable for each one.

   Example: mainScene=https://streamelements.com/overlay/abc/123

## Run the Application

Please make sure you've completed all steps in the "Getting Started" section before attempting to run the app.

### From the Command Line (CLI)

1. Change to the directory of the project `ttv-chat-light` if you have not already done so.
2. Run `npm start`
3. Open your browser and go to [http://localhost:1337/scenes?sceneName=<your-scene-name-from-.env>](http://localhost:1337/scenes?sceneName=)

   Example: [http://localhost:1337/scenes?sceneName=mainScene](http://localhost:1337/scenes?sceneName=mainScene)

### From VS Code

1. Go to the debugger view and confirm the debugger is set to "Server Start"
2. Press the "Start Debugging" button (the green play button)
3. Open your browser and go to [http://localhost:1337/scenes?sceneName=<your-scene-name-from-.env>](http://localhost:1337/scenes?sceneName=)

   Example: [http://localhost:1337/scenes?sceneName=mainScene](http://localhost:1337/scenes?sceneName=mainScene)

## Trying Things Out

Please make sure you've completed all steps in the "Getting Started" and "Run the Application" sections before attempting to try out the app.

1. Open up a new browser tab or window and navigate to the chat for the Twitch channel you want to use (defaults to "clarkio" in the `.env` file under `TTV_CHANNELS`)

   Example: [https://www.twitch.tv/popout/clarkio/chat](https://www.twitch.tv/popout/clarkio/chat)

   > If you'd like to have the client connect to another channel you can add it to the `TTV_CHANNELS` environment variable. The variable is comma-delimited so you can have it as clarkio,"your channel name" to connect to multiple channels

2. Enter the following chat message "!bulb go green" and you should see your overlay change color in your other tab/window which loaded [http://localhost:1337/scenes?sceneName=mainScene](http://localhost:1337/scenes?sceneName=mainScene)

   > WARNING: the implementation is currently based off of an overlay being blue by default and will alter the hue from that. If your overlay default color is different it will not exactly change to the color you may be intending. We are working on making this better to support different default overlay colors.
