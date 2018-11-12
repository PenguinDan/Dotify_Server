'use strict'

// Modules
const CONSTANTS = require('./helper/constants');
const UTIL = require('./helper/utilities');
const DGRAM = require('dgram');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));

// Setup UDP Socket
const PEER_SOCKET = DGRAM.createSocket('udp4');

// Script Values
let port = 0;

// Test to see that the socket is listening on the specified port
PEER_SOCKET.on('listening', () => {
    UTIL.logAsync(`Listening on port: ${port}`);
});

PEER_SOCKET.on('message', (msg, rinfo) => {
    // if the message is to close, Exit the process
    if (msg == 'close'){
        PEER_SOCKET.close(async () => {
            // Retrieve and parse the JSON file
            let udpFile = await FS.readFileAsync(CONSTANTS.UDP_CONFIG_FILEPATH);
            // Parse the retrieved json file
            let udpJson = JSON.parse(udpFile);
            // Remove the port value from the used ports
            udpJson.usedPorts.splice(udpJson.usedPorts.indexOf(port), 1);
            // Add to the list of safe ports since this port will now be free
            udpJson.safePorts.unshift(port);
            // Save the udp json object to disk
            FS.writeFile(CONSTANTS.UDP_CONFIG_FILEPATH, JSON.stringify(udpJson), (err) => {
                UTIL.logAsync(`Port ${port} closed. Child killed.`);
                UTIL.logAsync("Saved updated udp json file");
                // End the process
                process.exit(0);
            });
        })
    } else {
        UTIL.logAsync("Message from client: " + msg);
    }
});

// Received a message from the parent
process.on('message', function(portVal){
    // Bind the socket
    port = portVal;
    PEER_SOCKET.bind(port);
});