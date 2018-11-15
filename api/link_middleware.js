'use strict'

// Necessary Modules
const { fork } = require('child_process');
const CONSTANTS = require('./helper/constants');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));

let createPeer =  function(){
    return new Promise( async (resolve, reject) => {
        try {
            // Retrieve and parse the JSON file
            let udpFile = await FS.readFileAsync(CONSTANTS.UDP_CONFIG_FILEPATH);
            // Parse the retrieved json file
            let udpJson = JSON.parse(udpFile);
            // Retrieve a port to use
            let port = udpJson.safePorts.pop();
            // Add to the list of currently used ports
            udpJson.usedPorts.push(port);
            // Save the udp json object to disk
            FS.writeFile(CONSTANTS.UDP_CONFIG_FILEPATH, JSON.stringify(udpJson), (err) => {

            });

            // Spawn a peer object for the user, currently testing right now
            let childProcess = fork('api/spawn_peer.js');
            // Send the port value to the child process
            childProcess.send(port);

            resolve(port);

        }catch(exception) {
            reject(exception);
        }
    });
};

// Export functions and variables
module.exports = {
    createPeer
};
  