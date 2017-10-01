# homebridge-neeo
Homebridge plugin for the NEEO brain and remote

This Homebridge plugin allows triggering HomeKit scenes from the NEEO remote and triggering NEEO recipes from the iOS Home app as well as Siri commands.

Before installing, you will need to install the homebridge package. Please read through the Homebridge readme. There are instructions available there for running homebridge on a Raspberry Pi at startup. Once you have homebridge installed and running, install the NEEO plugin by typing "npm install -g homebridge-neeo". The "-g" flag installs the plugin globally which is usually needed when running Homebridge as a startup process.

To configure the homebridge-neeo plugin for your environment, edit the included config-sample.json file and modify the following items:
1. neeoBrain - update this value with your NEEO Brain's hostname. You can get this from the NEEO remote's settings screen.
2. Edit the scenes list to include your HomeKit scenes that you would like to be able to trigger from your NEEO remote.
3. Modify the bridge section of the config file if you modified any of the Homebridge default settings when you installed Homebridge
4. Save the config-sample.json as config.json file to Homebridge's home directory. This location depends on whether you are running Homebridge as a local process or a startup process.
5. Start Homebridge

This plugin is a combination of homebridge plugin and neeo driver. It provides two capabilities.

The first is the ability to trigger HomeKit scenes from the NEEO remote or the mobile app. This is achieved by adding a custom accessory to NEEO. You can add this accessory by searching for homekit or scene when adding a new device to NEEO. This accessory will show up as Homebridge HomeKit Buttons and provides shortcuts for the scenes that you defined in the config.json file and added as buttons in the index.js file. To complete the configuration, open the iOS Home app and look for a new button names 'NEEO Buttons 1'. Each button can trigger upto three NEEO recipes so the plugin will automatically create additional buttons if you have configured more than three HomeKit scenes in the plugin. Long press on the 'NEEO Buttons 1' button and open the Details page. Scroll to the bottom of the Details page where you will find configurations for Single Press (0), Double Press (1) and Long Press (2). Assign a scene to each of these making sure to match the configuration in your index.js. Once configured, you should be able to add these NEEO shortcuts to a recipe and activate HomeKit scenes by pressing the NEEO shortcut button.

The second ability allows triggering NEEO recipes from the iOS Home app or using Siri commands like "Hey Siri, turn on the TV switch". The homebridge-neeo plugin will automatically retieve all recipes from NEEO and create switches for each recipe in HomeKit. When you add the Homebridge accessory to the Home app for the first time, these switches will be added as well. You should now be able to activate NEEO recipes by pressing the switch button in the Home app or instructing Siri to turn it on.

The plugin has room for improvement (use dynamic homebridge platform, build NEEO shortcuts and associated HomeKit buttons using the homebridge API rather than the websocket method). My coding is very rusty so it will be slow going. I'm open to suggestions or collaborators.

Sources for inspiration came from homebridge-savant and homebridge-harmony projects and also from the various NEEO drivers already on github.
