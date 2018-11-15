'use strict'

// Modules
const CONSTANTS = require('./helper/constants');
const UTIL = require('./helper/utilities');
const DGRAM = require('dgram');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
var WebTorrent = require('webtorrent-hybrid')
let CLIENT = new WebTorrent();

// When the client has an error.
CLIENT.on('error', function (err) {
    UTIL.logAsync("Error in the client");
    UTIL.logAsync(err);
});

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
        // Checking if the torrent id is null.
        if(!torrentId){
            UTIL.logAsync("Torrent id  requested was invalid.");
            return;
        }
        
        // Downloading the torrent with hashInfo.
        var torrent = await CLIENT.add(torrentId);        
        
        // Checking if the torrent gave any results.
        if(!torrent){
            UTIL.logAsync("The torrent was not valid");
            return;
        }

        // When the torrent has an error, this method will be called.
        torrent.on('error', function (err) {
            UTIL.logAsync("Error in the Torrent");
            UTIL.logAsync(err);
        });

        
        UTIL.logAsync("Client: " +  CLIENT.nodeId +  " Added torrent: " + torrent.infoHash);
        // WHen the torrent is finished downloading, it will automatically being to seed and run this function.
        torrent.on('done', async function(){
            UTIL.logAsync('Torrent download finished.');
            // Getting the file from the torrent.
            var file = await this.files.find(async function (file) {
                return file.name.endsWith('.mp3');
            });
            UTIL.logAsync("File name: " + file.name);
            // Getting the buffer and sending it.
            file.getBuffer(async function (err, buffer) {
                if (err) throw err;
                UTIL.logAsync('Sending file of length ' + buffer.length + " to "+ client_add +':'+ client_port);
                //
                let bufferUtil = Buffer.allocUnsafe(8);
                bufferUtil.writeInt32BE(buffer.length);
                //PEER_SOCKET.send(bufferUtil,0,bufferUtil.byteLength, client_port, client_add, function(err, bytes) {
                //    if (err) throw err;
                //    UTIL.logAsync('Sent log');
                    //Sending the music stream(file buffer).
                    
                //});
                PEER_SOCKET.send(buffer, 0, buffer.length, client_port, client_add);
                UTIL.logAsync('Sent Stream');
                
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