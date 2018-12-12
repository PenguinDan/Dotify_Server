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

let udpPort = 0;
let tcpPort = 0;

// The song the client is currently listening to.
let CURRENTBUFFER;

// Length of the iterations being sent.
var len = 10000;

var iters = 1;

// Test to see that the socket is listening on the specified port
PEER_SOCKET.on('listening', () => {
    UTIL.logAsync(`Listening on udpPort: ${udpPort}`);
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
            udpJson.usedPorts.splice(udpJson.usedPorts.indexOf(udpPort), 1);
            // Add to the list of safe ports since this port will now be free
            udpJson.safePorts.unshift(udpPort);
            // Save the udp json object to disk
            FS.writeFile(CONSTANTS.UDP_CONFIG_FILEPATH, JSON.stringify(udpJson), (err) => {
                UTIL.logAsync(`Port ${udpPort} closed. Child killed.`);
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
process.on('message', function(portVals){
    // Bind the socket
    udpPort = portVals.udpPort;
    tcpPort = portVals.tcpPort;
    PEER_SOCKET.bind(udpPort);
    instantiateSelfConnection(tcpPort);
    instantiateGrpcConnection(tcpPort);
});


// -------------- GRPC from Server or Node ------------------
let counter = 0;
let nodeCount = 0;
let currKeyValList = {};
let nodeRangeStart = 0;
let nodeRangeStop = 0;

function map(call, callback) {
    UTIL.logAsync(`Current node at ${tcpPort} received map call`);
    // Initialize some values for our current node for the current sort sequence
    nodeRangeStop = call.request.alphabetRangeStop;
    nodeRangeStart = call.request.alphabetRangeStart;

    UTIL.logAsync(`Node range values : ${nodeRangeStart} , ${nodeRangeStop}`);

    // Loading the .proto from the Node package definition.
    const grpcToNode = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;
    // Let the node know the number of total nodes everywhere
    nodeCount = Object.keys(call.request.alphabetRangePortMap).length;

    UTIL.logAsync(`Node Count Value ${nodeCount}`);

    // Special case when there is only one node
    if(nodeCount == 1) {
        // The map from alphabets to the index values sorted by the keys.
        let sortedMap = orderKeys(call.request.keyVal);
        UTIL.logAsync(`Current node at ${tcpPort} finished sorting`);

        UTIL.logAsync("Sort finished, sending reduceFinished request to server");
        const grpcToServer = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;
        const toServer = new grpcToServer.ServerRequests(`0.0.0.0:${SERVER_GRPC_PORT}`, grpc.credentials.createInsecure());
        toServer.reduceFinished({keyVal : sortedMap}, function(err, response){
            if (err) {
                UTIL.logAsync(err);
            } else {
                UTIL.logAsync(`Node at TCP Port ${tcpPort} successfully sent reduceFinished to server`);
            }
        });
    } else {
        let portMap = call.request.alphabetRangePortMap;

        // Map the keyVals into their respective lists
        let mapList = mapKeys(call.request.keyVal);

        console.log(portMap);
        console.log('-------- Port Map ------------');
        // Iterating through the list to sort and then send call other nodes to sort their values.
        for(let [key, port] of Object.entries(portMap)) {
            // Retrieve the index for which node this is being sent to
            let index = Math.floor(parseInt(key.split(',')[0]) - 65) / (Math.ceil(26/ nodeCount)  + 1);

            // If the current value is the tcpPort currently attached to this node, then just save it in our node
            if(port == tcpPort) {
                currKeyValList = Object.assign({}, currKeyValList, mapList[index]);
            } else {
                let toNode = new grpcToNode.NodeRequests(`0.0.0.0:${port}`, grpc.credentials.createInsecure());
                toNode.reduce({keyVal: mapList[index]} , function(err, response) {
                    if(err) {
                        UTIL.logAsync(err);
                    } 
                });
            }

        }
    }
    callback(null);
}

// Received the reduce request from another node, simply add it to our list
function reduce(call, callback) {
    counter++;
    currKeyValList = Object.assign({}, currKeyValList, call.request.keyVal);
    if(counter >= nodeCount - 1) {
        emitCompleted();
    }

    callback(null);
}

function emitCompleted() {
    // Sort the keyValList
    let sortedKeyVal = orderKeys(currKeyValList);

    //Already sorted because the reduce step, send it to the server
    UTIL.logAsync(`Sort from ${tcpPort} finished, sending reduceFinished request to server from emitCompleted`);
    UTIL.logAsync(`Node range values : ${nodeRangeStart} , ${nodeRangeStop}`);

    const grpcToServer = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;
    const toServer = new grpcToServer.ServerRequests(`0.0.0.0:${SERVER_GRPC_PORT}`, grpc.credentials.createInsecure());
    toServer.reduceFinished({
        keyVal : sortedKeyVal,
        alphabetRangeStart : nodeRangeStart,
        alphabetRangeStop : nodeRangeStop
    }, function(err, response){
        if (err) {
            UTIL.logAsync(err);
        } else {
            UTIL.logAsync(`Node at TCP Port ${tcpPort} successfully sent reduceFinished to server`);
        }
    });
}

// ------------ Sorts a map returning sorted map key and values. ------------
function orderKeys(obj) {

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

// -------------- Places the Keys in their appropriate containers ----------------

function mapKeys(keyVal) {
    // Create the list mapping 
    let listMap = new Array(nodeCount);
    let storeIndex = 0;

    for(let [key, val] of Object.entries(keyVal)) {
        let charVal = key[0].toUpperCase().charCodeAt(0);
        storeIndex = Math.floor( (charVal - 65 ) / ((Math.ceil(26/ nodeCount)  + 1)));

        if (!listMap[storeIndex]) {
            listMap[storeIndex] = {}
        }
        let newDict = {}
        newDict[key] = val;
        listMap[storeIndex] = Object.assign({}, listMap[storeIndex], newDict);
    }

    return listMap;
}

//---------------------------------------------------------------------------------

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
        if (err) {
            UTIL.logAsync(err);
        } else {
            UTIL.logAsync(`Node at TCP Port ${port} successfully sent to creation call to server`);
        }
    });
}