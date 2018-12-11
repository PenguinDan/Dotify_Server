'use strict'

// Modules
const CONSTANTS = require('./helper/constants');
const UTIL = require('./helper/utilities');
const DGRAM = require('dgram');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
var WebTorrent = require('webtorrent-hybrid')
let CLIENT = new WebTorrent();
const math = require('mathjs');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const SERVER_GRPC_PORT = 50002;
// When the client has an error.
CLIENT.on('error', function (err) {
    UTIL.logAsync("Error in the client");
    UTIL.logAsync(err);
});

// GRPC
const NODE_PROTO_PATH = __dirname + '/Proto/NodePb.proto';
const nodePackageDefinition = protoLoader.loadSync(
    NODE_PROTO_PATH,
    {
        keepCase : true,
        longs : String,
        enums : String,
        defaults : true,
        oneofs : true
    }
);
const nodeProto = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;

// REDUCE Key Value list map.
let keyValList = new Map();


// Setup UDP Socket
const PEER_SOCKET = DGRAM.createSocket('udp4');

let port = 0;

// The song the client is currently listening to.
let CURRENTBUFFER;

// Length of the iterations being sent.
var len = 10000;

var iters = 1;

// Test to see that the socket is listening on the specified port
PEER_SOCKET.on('listening', () => {
    UTIL.logAsync(`Listening on port: ${port}`);
});

PEER_SOCKET.on('message', (msg, rinfo) => {
    UTIL.logAsync("Type of: " + Number(msg))
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
        });
    }
    else if(Number(msg) < 10000000){
        var position = Number(msg);
        var curLen = len;
        UTIL.logAsync("Buffer length " + CURRENTBUFFER.length);
        // Looping iters times to send that many packets of size len 
        if(CURRENTBUFFER.length - position < len){
            curLen = math.max(CURRENTBUFFER.length - position,0);
            UTIL.logAsync("Changing size of len." + curLen);
        }else{
            UTIL.logAsync("Len remains the same size." + curLen);
        }
        for(var i = 0; i < iters; i++){
            UTIL.logAsync("Sending at position: " + position);
            //Socket sending a buffeer starting at position, going len into position to port and address.
            PEER_SOCKET.send(CURRENTBUFFER, position, curLen, rinfo.port, rinfo.address);
            position += len;
        }
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
                
                let bufferUtil = Buffer.allocUnsafe(8);
                bufferUtil.writeInt32BE(buffer.length);
                PEER_SOCKET.send(bufferUtil,0,bufferUtil.byteLength, client_port, client_add, function(err, bytes) {
                    if (err) throw err;
                    UTIL.logAsync('Sent length log');
                    //Sending the music stream(file buffer).
                    // Setting global buffer;
                    CURRENTBUFFER = buffer
                    //let pos = 0;
                    // Looping iters times to send that many packets of size len
                    //for(var i = 0; i < iters; i++){
                     //   UTIL.logAsync("Sending at position: " + pos);
                        //Socket sending a buffeer starting at position, going len into position to port and address.
                    //    PEER_SOCKET.send(buffer, pos, len, client_port, client_add);
                     //   pos += len;
                   // }
                   // UTIL.logAsync('Sent Stream');

                });
                
                
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
    instantiateSelfConnection(port);
    instantiateGrpcConnection(port);
});


// -------------- GRPC from Server or Node ------------------
let counter = 0;

function map(call, callback) {
    UTIL.logAsync(call.request.keyVal);

    // Loading the .proto from the Node package definition.
    const grpcToNode = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;

    // The map from alphabets to the index values sorted by the keys.
    let sortedMap = orderKeys(call.request.keyVal);

    // Map of alphabet ASCII ranges for each node, mapped to a port value. i.e <key(string): '108,125', value(int32): 10233>.  
    let portMap = call.request.alphabetRangePortMap;

    // Iterating through the list to sort and then send call other nodes to sort their values.
    Object.entries(portMap).forEach(entries =>{
        // Comparing the starting letter from the key of the entry in portMap to this ports start letter (since this port is included in the map).
        if (call.request.alphabetRangeStart != entries[0].split(',')){
            const toNode = new grpcToNode.NodeRequests(`0.0.0.0:${port}`, grpc.credentials.createInsecure());
            toNode.reduce({keyVal: sortedMap});
            
            toNode.emitCompleted();
        }
    });
}

function reduce(keyValMap, callback) {
    Object.entries(keyValMap).forEach(entries =>{
        keyValList[entries[0]] = entries[1];
    });
}

function emitCompleted(call, callback) {
    counter++;
    if(counter >= 4){
        //Already sorted because the reduce step.
    }

}

// ------------ Sorts a map returning sorted map key and values. ------------
function orderKeys(obj, expected) {

    var keys = Object.keys(obj).sort(function keyOrder(k1, k2) {
        if (k1 < k2) return -1;
        else if (k1 > k2) return +1;
        else return 0;
    });
  
    var i, after = {};
    for (i = 0; i < keys.length; i++) {
      after[keys[i]] = obj[keys[i]];
      delete obj[keys[i]];
    }
    for (i = 0; i < keys.length; i++) {
      obj[keys[i]] = after[keys[i]];
    }
    return obj;
  }
  

function instantiateSelfConnection(port) {
    const grpcNodeServer = new grpc.Server();
    grpcNodeServer.addService(nodeProto.NodeRequests.service, {
        map : map,
        reduce : reduce, 
        emitCompleted : emitCompleted
    });
    grpcNodeServer.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());
    grpcNodeServer.start(); 
}

// --------------- GRPC to Server ---------------------
function instantiateGrpcConnection(port) {
    const grpcToServer = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;
    const toServer = new grpcToServer.ServerRequests(`0.0.0.0:${SERVER_GRPC_PORT}`, grpc.credentials.createInsecure());
    toServer.creation({portVal : port}, function(err, response){
        UTIL.logAsync("Successfully sent to server");
    });
}