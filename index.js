//'use strict';
var Service, Characteristic;
const request = require('request');
const url = require('url');
const WebSocket = require('ws');
// The homebridge-websocket plugin is required and must be installed separately

console.log('--------------HomeBridge adapter-------------');

/*
 * NEEO API Initialization
 */

const neeoapi = require('neeo-sdk');
const controller = require('./controller');

// Build HomeKitSceneDevice for NEEO Brain
// Add or change the button names and labels below to macth your HomeKit scenes
// This device can be searched for in the NEEO app when adding new device. You can add the buttons defined below as shortcuts in your NEEO recipes.
// To-do: add buttons dynamically based on list in config.json
const homekitSceneDevice = neeoapi.buildDevice('HomeKit Buttons')
  .setManufacturer('HomeBridge')
  .addAdditionalSearchToken('scene')
  .setType('ACCESSOIRE')

  // Then we add the capabilities of the device
  .addButton({ name: 'evening', label: 'Evening' })
  .addButton({ name: 'dinner-time', label: 'Dinner Time' })
  .addButton({ name: 'watch-tv', label: 'Watch TV' })
  .addButton({ name: 'movie-time', label: 'Movie Time' })
  .addButton({ name: 'bedtime', label: 'Bedtime' })
  .addButton({ name: 'great-room-lights', label: 'Great Room Lights' })
  .addButtonHander(controller.onButtonPressed);


function startHomebridgeDriver(brain) {
  console.log('NEEO - Start HomeBridge Driver');
  neeoapi.startServer({
    brain,
    port: 6336,
    name: 'homebridge-driver',
    devices: [homekitSceneDevice]
  })
  .then(() => {
    console.log('NEEO READY! use the NEEO app to search for "HomeKit Buttons".');
  })
  .catch((error) => {
    //if there was any error, print message out to console
    console.error('NEEO ERROR!', error.message);
    process.exit(1);
  });
}

/*
 * NEEO API Initialization Complete
 */

// Function to parse URLs and send to NEEO Brain for device or recipe control
// neeoURL is expected in format http://<Brain_IP>:3000/v1/projects/home/
// To-do: Needs to be updated to support PUT
function callNeeo(neeoUrl, callback){
	request({
    url: neeoUrl,
    method: 'GET',
  }, 
  function (error, response, body) {
    if (error) {
      console.log('ERROR: ' + error.message);
      console.log('STATUS: ' + response);
      return next(error);
    }
    let json = JSON.parse(body);
    callback(json);
  });
}

// Initialize the homebridge-neeo plugin for Homebridge
module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerPlatform('homebridge-neeo', 'Neeo', NeeoPlatform);
}

// Define the Neeo Platform for Homebridge and start the NEEO API server
// NEEO Brain IP or hostname (preferred) can be defined in config.json
// Had some issues when using NEEO Brain auto-discovery. Providing NEEO Brain's hostname seemed more stable
function NeeoPlatform(log, config) {
	this.log = log;
	this.config = config;

  const brainIp = this.config["neeoBrain"] + '.local';
  if (brainIp) {
    console.log('NEEO - use NEEO Brain IP from env variable', brainIp);
    startHomebridgeDriver(brainIp);
  }
  else {
    console.log('NEEO - discover one NEEO Brain...');
    neeoapi.discoverOneBrain()
      .then((brain) => {
        console.log('NEEO - Brain discovered:', brain.name);
        startHomebridgeDriver(brain);
      });
  }
}

NeeoPlatform.prototype = {
  accessories: function(callback) {
    
    // Need to update HomeKit button creation to use Homebridge API rather than websocket calls
    const ws = new WebSocket('ws://localhost:4050/');  
    var myAccessories = [];
    var that = this;

    // Retrieve names and labels of scenes from config.json
    var neeoButtons = this.config.scenes;
    // Calculate how many Stateless Programmable Switches (buttons) are needed. The button has three states
    // each of which can be assigned to trigger a different scene in the iOS Home app.
    var neeoButtonsCount = Math.ceil(neeoButtons.length/3);
    this.log('Create ' + neeoButtonsCount + ' NEEO buttons in HomeKit for ' + neeoButtons.length + ' scenes');

    // The below method is used to create buttons using the Homebridge API
    // This can replace the websocket method further below once issue with triggering these buttons can be resolved
    /*for (i = 1; i <= neeoButtonsCount; i++) {
        var accessory = new NeeoAccessory(this.log, 'NEEO Buttons ' + i, 'button');
        myAccessories.push(accessory);
        that.log('Created ' + accessory.name + ' Accessory');
     */

    // Uses the homebridge-websocket plugin to create new HomeKit buttons
    // These buttons will show up in the iOS Home as NEEO Buttons X
    ws.on('open', function open() {
      //console.log('Socket Opened');
      for (i = 1; i <= neeoButtonsCount; i++) {
        var SocketMsg = "{\"topic\": \"add\", \"payload\": {\"name\": \"NEEO Buttons " + i + "\", \"service\": \"StatelessProgrammableSwitch\"}}";
        ws.send(SocketMsg);

        ws.on('message', function incoming(data) {
          console.log('Looking for return message');
          console.log(data);
        });
      };
      ws.close();
      ws.on('close', function close() {
        //console.log('disconnected');
      });
    });

    // Retrieve list of all recipes from NEEO Brain and add them as switches to HomeKit
		this.neeoBrain = this.config["neeoBrain"];
	  this.getRecipeUrl = url.parse('http://' + this.neeoBrain + '.local:3000/v1/api/recipes');

    this.log('Fetching Neeo Recipes...');
    callNeeo(this.getRecipeUrl, function(foundAccessories) {
		  that.log('Retrieved ' + foundAccessories.length + ' recipes from NEEO Brain');
      for (i in foundAccessories) {
        recipeDetail = JSON.parse(JSON.stringify(foundAccessories[i].detail));
        recipeName = recipeDetail.devicename.replace("%20", " ");
        recipeUrl = JSON.parse(JSON.stringify(foundAccessories[i].url));

        that.log('Adding Accessory: ' + recipeName);
        var accessory = new NeeoAccessory(this.log, foundAccessories[i], 'switch');
        that.log('Created ' + accessory.name + ' Accessory');
         	
				myAccessories.push(accessory);
      };
      that.log('Returning ' + myAccessories.length + ' accessories');
      callback(myAccessories);
    });
  }
}

function NeeoAccessory(log, recipe, deviceType) {
  this.log = log;
  this.recipe = recipe;
  this.deviceType = deviceType;

  // If creating a switch accessory, then define switch name and NEEO recipe power control URLs
  if (deviceType == 'switch') {
    var detail = JSON.parse(JSON.stringify(this.recipe.detail));
    this.name = detail.devicename.replace("%20", " ");
    var powerUrl = JSON.parse(JSON.stringify(this.recipe.url));

    this.onCommand = powerUrl.setPowerOn;
    this.offCommand = powerUrl.setPowerOff;
    this.queryCommand = powerUrl.getPowerState;
  }
  else if (deviceType == 'button') {
    this.log('Creating button ' + recipe);
    this.name = recipe;
  }
}

NeeoAccessory.prototype = {
  getServices: function() {
    var informationService = new Service.AccessoryInformation();
    informationService
    .setCharacteristic(Characteristic.Manufacturer, 'NEEO')
    .setCharacteristic(Characteristic.Model, 'Brain')
    //.setCharacteristic(Characteristic.SerialNumber, 'Neeo Serial Number');

    if (this.deviceType == 'switch') {
      var switchService = new Service.Switch(this.name);
      switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setState.bind(this));
      console.log('Adding switch services');
      this.informationService = informationService;
      this.switchService = switchService;
      return [informationService, switchService];
    }
    else if (this.deviceType == 'button') {
      var buttonService = new Service.StatelessProgrammableSwitch(this.name);
      buttonService
      .getCharacteristic(Characteristic.ProgrammableSwitchEvent)
      //.on('get', this.getPowerState.bind(this))
      .on('set', this.setEvent.bind(this));
      informationService.setCharacteristic(Characteristic.Name, this.name);
      console.log('Adding button services');
      this.informationService = informationService;
      this.buttonService = buttonService;
      return [informationService, buttonService];
    }
  },

  // For future use
  setEvent: function(callback) {
    console.log('Button pressed');
    callback();
  },

  // This function is called when user toggles a switch in the iOS Home app
  // The NEEO API server is called with the requested recipe power state URL
  setState: function(powerOn, callback) {
    var accessory = this;

    if (powerOn == 0) neeoCommand = url.parse(accessory.offCommand)
    else neeoCommand = url.parse(accessory.onCommand);

    callNeeo(neeoCommand, function(response) {
      console.log(accessory.name + ' power set to ' + powerOn);
      callback();
    });
  },

  // This function updates the current state of all NEEO recipe switches in HomeKit
  // Currently, state is updated only when the Home app is opened or when user switches from one room to another
  // Needs work so that all NEEO recipe switch states are updated when any switch state changes
  // E.g. If Watch TV recipe is currently active and user then presses the Watch Apple TV switch,
  // both switches will show On in the Home app, however NEEO remote will only show Watch Apple TV as active
  getPowerState: function(callback) {
    //console.log("Calling the function to get current state...");
    var accessory = this;
    var getneeo = url.parse(accessory.queryCommand);

    callNeeo(getneeo, function(switchState) {
      //console.log(accessory.name + ' power state: ' + switchState.active);
      callback(null, switchState.active);
    });
  }
}