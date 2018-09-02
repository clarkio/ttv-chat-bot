# ttv-chat-light

Twitch TV chat reader to change the color of overlays loaded from streamelements and/or colors of internet connected lights via Azure Bot Service and Language Understanding AI (LUIS)

## Getting Started

1. git pull git@github.com:clarkio/ttv-chat-light.git
2. cd `ttv-chat-light`
3. npm install
4. Login on [https://twitch.tv](https://twitch.tv)
5. Go to [https://twitchapps.com/tmi/](https://twitchapps.com/tmi/)
   a. Click "Connect with Twitch"
   b. Click "Authorize"
   c. Copy the token value (starts with "oauth:")
6. Rename the file `.env-example` to `.env`
7. Update `TTV_CLIENT_TOKEN` with the token value you copied before in step 4.c
8. For each overlay in streamelements (a.k.a. scenes) copy the URL to the scene and add it to the `.env` file as a new environment variable for each one.
   Example: mainScene=https://streamelements.com/overlay/abc/123

## Run the application

Please make sure you've completed all steps in the "Getting Started" section before attempting to run the app.

### From the Command Line (CLI)

1. Change to the directory of the project `ttv-chat-light` if you have not already done so.
2. Run `npm start`
3. Open your browser and go to [localhost:1337/scenes?sceneName=<your-scene-name-from-.env>](localhost:1337/scenes?sceneName=)
   Example: [localhost:1337/scenes?sceneName=mainScene](localhost:1337/scenes?sceneName=mainScene)

### From VS Code

1. Go to the debugger view and confirm the debugger is set to "Launch"
2. Press the "Start Debugging" button (the green play button)
3. Open your browser and go to [localhost:1337/scenes?sceneName=<your-scene-name-from-.env>](localhost:1337/scenes?sceneName=)
   Example: [localhost:1337/scenes?sceneName=mainScene](localhost:1337/scenes?sceneName=mainScene)
