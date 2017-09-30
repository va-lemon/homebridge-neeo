#!/usr/bin/env node
'use strict';

const WebSocket = require('ws');

/*
 * Device Controller
 * This controller forwards NEEO remote button presses to homebridge
 * which triggers the respective scene in HomeKit
 */
module.exports.onButtonPressed = function onButtonPressed(name) {
	const ws = new WebSocket('ws://localhost:4050/');	
  	console.log(`[NEEO CONTROLLER] ${name} button pressed`);
	ws.on('open', function open() {

		// Update this list with scene names, which Programmable Switch was programmed for that scene,
		// and which Programmable Switch Event was assigned to trigger the scene in the Home app
		// Single Press = 0
		// Double Press = 1
		// Long Press = 2
		if (name == "evening")
			var SocketMsg = "{\"topic\": \"set\", \"payload\": {\"name\": \"NEEO Buttons 1\", \"characteristic\": \"ProgrammableSwitchEvent\", \"value\": \"0\"}}";
  		else if (name == "dinner-time")
			var SocketMsg = "{\"topic\": \"set\", \"payload\": {\"name\": \"NEEO Buttons 1\", \"characteristic\": \"ProgrammableSwitchEvent\", \"value\": \"1\"}}";
		else if (name == "watch-tv")
  			var SocketMsg = "{\"topic\": \"set\", \"payload\": {\"name\": \"NEEO Buttons 1\", \"characteristic\": \"ProgrammableSwitchEvent\", \"value\": \"2\"}}";
  		else if (name == "movie-time")
			var SocketMsg = "{\"topic\": \"set\", \"payload\": {\"name\": \"NEEO Buttons 2\", \"characteristic\": \"ProgrammableSwitchEvent\", \"value\": \"0\"}}";
  		else if (name == "bedtime")
			var SocketMsg = "{\"topic\": \"set\", \"payload\": {\"name\": \"NEEO Buttons 2\", \"characteristic\": \"ProgrammableSwitchEvent\", \"value\": \"1\"}}";
		else if (name == "great-room-lights")
  			var SocketMsg = "{\"topic\": \"set\", \"payload\": {\"name\": \"NEEO Buttons 2\", \"characteristic\": \"ProgrammableSwitchEvent\", \"value\": \"2\"}}";

		ws.send(SocketMsg);
//  		console.log('JSON message sent');

		ws.on('message', function incoming(data) {
  			console.log('Looking for return message');
  			console.log(data);
		});
  		
  		ws.close();

	  	ws.on('close', function close() {
//  			console.log('disconnected');
		});
	});
};

