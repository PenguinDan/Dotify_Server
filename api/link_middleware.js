'use strict'

// Necessary Modules
const { fork } = require('child_process');
const CONSTANTS = require('./helper/constants');
const UTIL = require('./helper/utilities');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));

function createPeer(req, res){
    // Authenticate the client to see that they have the permissions to spawn a peer
    UTIL.authenticateApp(req).then(async function(result){
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
        // Return the port to create a new process under
        return port;
    }).then((port) => {
        // Spawn a peer object for the user, currently testing right now
        let childProcess = fork('api/spawn_peer.js');
        // Send the port value to the child process
        childProcess.send(port);

        // Return a message back to the client specifying that the socket 
        // got created successfully and the port corresponding to the socket
        return res.status(CONSTANTS.CREATED).json({
            "message" : "New process created successfully",
            "port" : port
        });
    }).catch(function(error) {
        // Error while running the create peer function
        UTIL.logAsync(`Error in link_middleware.js\nError Message: ${error.message}`)
        return res.status(error.code).json({"Message" : error.message});
    });
}

// Export functions and variables
module.exports = {
    createPeer
};
  