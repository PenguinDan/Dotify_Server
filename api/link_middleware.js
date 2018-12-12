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
            // Retrieve a udp port to use
            let udpPort = udpJson.safePorts.pop();
            // Add to the list of currently used udp ports
            udpJson.usedPorts.push(udpPort);
            // Save the udp json object to disk
            FS.writeFile(CONSTANTS.UDP_CONFIG_FILEPATH, JSON.stringify(udpJson), (err) => {

            });

            // Retrieve and parse the JSON file to get a valid TCP Port
            let tcpFile = await FS.readFileAsync(CONSTANTS.TCP_CONFIG_FILEPATH);
            // Parse the retrieved json file
            let tcpJson = JSON.parse(tcpFile);
            // Retrieve the port to use
            let tcpPort = tcpJson.safePorts.pop();
            // Add to the list of currently used tcp ports
            tcpJson.usedPorts.push(tcpPort);
            // Save tht tcp json obect to disk
            FS.writeFile(CONSTANTS.TCP_CONFIG_FILEPATH, JSON.stringify(tcpJson), (err) => {

            });

            // Spawn a peer object for the user, currently testing right now
            let childProcess = fork('api/spawn_peer.js');
            // Send the port value to the child process
            childProcess.send({
                udpPort : udpPort,
                tcpPort : tcpPort
            });

            resolve({
                udpPort : udpPort,
                tcpPort : tcpPort
            });

        }catch(exception) {
            reject(exception);
        }
    });
};

// Export functions and variables
module.exports = {
    createPeer
};
  