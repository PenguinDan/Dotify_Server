'use strict'

// Modules
const CONSTANTS = require('./helper/constants');
const UTIL = require('./helper/utilities');
const DGRAM = require('dgram');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
var WebTorrent = require('webtorrent-hybrid')
let CLIENT = new WebTorrent();

// Setup UDP Socket
const PEER_SOCKET = DGRAM.createSocket('udp4');

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
        UTIL.logAsync("GUID from client: " + msg + " from " + rinfo.address + ":" + rinfo.port);
        downloadSeed(msg, rinfo.address, rinfo.port);
    }
});


// Downloads and seeds a torrent after it is finished downloading.
async function downloadSeed(GUID, client_add, client_port ){
    try{
        UTIL.logAsync("Downloading and seeding torrent");
        let torrentId = String(GUID);
        if(!torrentId){
            UTIL.logAsync("Torrent id  requested was invalid.")
            return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Torrent Id requested was invalid"});
        }
        var torrent = await CLIENT.add(torrentId);        
        UTIL.logAsync("Client: " +  CLIENT.nodeId +  " Added torrent: " + torrent.infoHash);
        torrent.on('done', async function(){
            UTIL.logAsync('Torrent download finished.');
            PEER_SOCKET.send(this.fileTorrent, 0, this.fileTorrent.length, client_port, client_add, function(err, bytes) {
                if (err) throw err;
                UTIL.logAsync('UDP message sent to ' + client_add +':'+ client_port);
            });
        }); 
    }catch(err){
            UTIL.logAsync(err.message);
    }
}

// Received a message from the parent
process.on('message', function(portVal){
    // Bind the socket
    port = portVal;
    PEER_SOCKET.bind(port);
});