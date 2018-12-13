'use strict'

// Modules
const UTIL = require('./api/helper/utilities');
const CONSTANTS = require('./api/helper/constants');
const HTTP = require('http');
const HTTPS = require('https');
const EXPRESS = require('express');
const ROUTES = require('./api/router');
const BODY_PARSER = require('body-parser');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const HELMET = require('helmet');
const HASHMAP = require('hashmap');
const USER_MIDDLEWARE = require('./api/user_middleware');
const MUSIC_MIDDLEWARE = require('./api/music_middleware');
// const SEED_MUSIC = require('./Mp3_Dump/seed_music.js');
const { spawn } = require('child_process');
const DGRAM = require('dgram');
const LINK_MIDDLEWARE = require('./api/link_middleware');
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');


// // Setup Express routes
const HTTPAPP = EXPRESS();
const HTTPSAPP = EXPRESS();
const PEER_LINK_SOCKET = DGRAM.createSocket('udp4');

// // File Constants
const ONE_YEAR = 31536000000;
const HTTP_PORT = 80;
const SECURE_PORT = 443;
const SPAWN_PEER_PORT = 40000;
const SERVER_GRPC_PORT = 50002;
const CERT_LOC = '/etc/letsencrypt/live/www.dotify.online/';
const ROUTER = ROUTES(EXPRESS.Router());
const NODE_PROTO_PATH = __dirname + '/api/Proto/NodePb.proto';
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

// Incrase server listener count
require('events').EventEmitter.defaultMaxListeners = 30;

// Before anything, make sure to run any method that hasn't finished
// running because of a server crash
async function crashRecover(){
  // Open the request logs json file
  let requestLogs = await FS.readFileAsync(CONSTANTS.REQUEST_LOG_FILEPATH);
  // Turn the request log into a hash map object
  requestLogs = new HASHMAP(JSON.parse(requestLogs));
  // Retrieve all of the values from the hashmap
  let uuidKeys = requestLogs.keys();
  // Do each request
  for (let uuid of uuidKeys){
    let request = requestLogs.get(uuid);
    // Retrieve the request type of the logged request
    let requestType = request.requestType;
    // Depending on the request type, send the request the the appropriate
    // location
    switch(requestType) {
      case CONSTANTS.CREATE_ACCOUNT_REQUEST:{
        USER_MIDDLEWARE.createUser(request, null);
      }
      break;
      case CONSTANTS.UPDATE_USER_PASSWORD_REQUEST:{
        USER_MIDDLEWARE.updateUser(request, null);
      }
      break;
      case CONSTANTS.DELETE_PLAYLIST_REQUEST:{
        MUSIC_MIDDLEWARE.deletePlaylist(request, null);
      }
      break;
      case CONSTANTS.CREATE_PLAYLIST_REQUEST:{
        MUSIC_MIDDLEWARE.createPlaylist(request, null);
      }
      break;
      case CONSTANTS.ADD_SONG_TO_PLAYLIST_REQUEST:{
        MUSIC_MIDDLEWARE.addSongToPlaylist(request, null);
      }
      break;
      case CONSTANTS.DELETE_SONG_FROM_PLAYSLIST_REQUEST:{
        MUSIC_MIDDLEWARE.deleteSongFromPlaylist(request, null);
      }
      break;
      case CONSTANTS.SAVE_USER_PROFILE_IMAGE_REQUEST: {
	      USER_MIDDLEWARE.saveUserProfileImage(request, null);
      }
      break;
    }
  // Remove all of the uuid values from the logged hashmap
  UTIL.removeRequestLog(...uuidKeys);
  }
}
crashRecover();

// SSL Cipher Keys
let cipher =  ['ECDHE-ECDSA-AES256-GCM-SHA384',
'ECDHE-RSA-AES256-GCM-SHA384',
'ECDHE-RSA-AES256-CBC-SHA384',
'ECDHE-RSA-AES256-CBC-SHA256',
'ECDHE-ECDSA-AES128-GCM-SHA256',
'ECDHE-RSA-AES128-GCM-SHA256',
'DHE-RSA-AES128-GCM-SHA256',
'DHE-RSA-AES256-GCM-SHA384',
'!aNULL',
'!MD5',
'!DSS'].join(':');

// Redirect HTTP Connections to HTTPS
HTTPAPP.get('*', function(req, res, next) {
  if(req.headers.host === "dotify.online"){
    res.redirect('https://www.' + req.headers.host + req.originalUrl);
  }
  else{
    res.redirect('https://'+ req.headers.host + req.originalUrl);
  }
});

// Setup Helmet for HTTPS
HTTPSAPP.use(HELMET.hsts({
  maxAge:ONE_YEAR,
  includeSubdomains: true,
  force: true
}));

HTTPSAPP.use(BODY_PARSER.urlencoded({limit: '40mb', extended: true}));
HTTPSAPP.use(BODY_PARSER.json({limit: '40mb', extended: true}));
HTTPSAPP.use('/', ROUTER);
HTTPSAPP.use(EXPRESS.static(__dirname + '/public'));

let options = {
  key: FS.readFileSync(CERT_LOC + 'privkey.pem'),
  cert: FS.readFileSync(CERT_LOC + 'fullchain.pem'),
  ciphers: cipher
};

HTTPS.createServer(options, HTTPSAPP).listen(SECURE_PORT);
HTTP.createServer(HTTPAPP).listen(HTTP_PORT);

 // Spawn a peer object for the user, currently testing right now
// spawn('node',['./Mp3_Dump/seed_music.js']);

// UDP Requests to Initialize Peer proceses
PEER_LINK_SOCKET.on('message', function(msg, rinfo) {
  UTIL.logAsync(`Server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  // Check whether the message is an open peer message
  if (msg == "open"){
    UTIL.logAsync(`Creating a peer object for ${rinfo.address}:${rinfo.port}`);
    LINK_MIDDLEWARE.createPeer().then((port) => {
      let bufferUtil = Buffer.allocUnsafe(8);
      bufferUtil.writeInt32BE(port);
      // .send(Uint8Array, Offset, Byte Count, port, address
      PEER_LINK_SOCKET.send(bufferUtil, 0, bufferUtil.byteLength, rinfo.port, rinfo.address,(err) => {
        if(err) {
          UTIL.logAsync("Error sending a request to the client");
        }
      });
  
    }).catch((err) => {
      UTIL.logAsync(`Error initializing peer object.\nError Message: ${err.message}`);
    });
  }
});

// Specifies that the server is listening on specified port
PEER_LINK_SOCKET.on('listening', ()=>{
  const address = PEER_LINK_SOCKET.address();
  UTIL.logAsync(`Server listening ${address.address} : ${address.port}`);
});

PEER_LINK_SOCKET.bind(SPAWN_PEER_PORT);


// GRPC for node communication
// Create a list that the server keeps track of for all of the current nodes that are alive
const aliveNodePorts = [];

// GRPC Server
function sort(call, callback) {
  UTIL.logAsync("Server starting the sort implementation");
  let songFile = FS.readFileSync(CONSTANTS.SONG_DATABASE_FILE);
  let mapList = createKeyValuePair(JSON.parse(songFile));
  
  // let albumFile = FS.readFileSync(CONSTANTS.SONG_DATABASE_FILE);
  // let mapList = createKeyValuePair(JSON.parse(albumFile));
  
  // let artistFile = FS.readFileSync(CONSTANTS.ARTIST_DATABASE_FILE);
  // let mapList = createKeyValuePair(JSON.parse(artistFile));

  // let guidToInfoFile = FS.readFileSync(CONSTANTS.GUID_MAPPING_FILE);
  // let mapList = createKeyValuePair(JSON.parse(guidToInfoFile));
  UTIL.logAsync("Server finished splitting the files");

  let alphabetStartNum = 65;
  let incrVal = Math.ceil(26/aliveNodePorts.length);
  let alphabetEndNum = alphabetStartNum + incrVal;
  let alphabetRangePortMapDict = {};

  for(let i = 0; i < aliveNodePorts.length; i++) {
      let currNodePort = aliveNodePorts[i];

      UTIL.logAsync(`Sending map request to ${currNodePort}`);
      
      alphabetRangePortMapDict[`${alphabetStartNum}, ${alphabetEndNum}`] = currNodePort;

      alphabetStartNum = alphabetEndNum + 1;
      alphabetEndNum = alphabetStartNum + incrVal;
  }

  alphabetStartNum = 65;
  alphabetEndNum = alphabetStartNum + incrVal;

  for(let i = 0; i < aliveNodePorts.length; i++) {
    let currNodePort = aliveNodePorts[i];
    let currToNode = new nodeProto.NodeRequests(`0.0.0.0:${currNodePort}`, grpc.credentials.createInsecure());

    currToNode.map({ 
          keyVal : mapList[i],
          alphabetRangeStart : alphabetStartNum,
          alphabetRangeStop : alphabetEndNum,
          alphabetRangePortMap : alphabetRangePortMapDict
      }, function(err, response) {
        if(err) {
          UTIL.logAsync(err);
        } else {
          UTIL.logAsync(`Successfully send map request node`);
        }
      });

      alphabetStartNum = alphabetEndNum + 1;
      alphabetEndNum = alphabetStartNum + incrVal;
  }

  // Do something
  callback(null);
}

// Create a list that contains the current file's key, value mapping into their respective
// member node lists
function createKeyValuePair(currFile){
  let keys = Object.keys(currFile);
  let memberCount = aliveNodePorts.length;
  // Create a map for each member and into their map as appropriate
  let mapList = new Array(memberCount);

  // Repeatedly add items to each member's maps in order
  for (let i = 0; i < keys.length; i++) {
    // Index is equal to the i value mod the number of members so that we can 
    // add in to the maps in consecutive orders
    let index = i % memberCount;

    // The current index is a new map object if it hasn't been initialized
    if(!mapList[index]) {
      mapList[index] = {}
    }

    // Add into the current mapList[index]
    // Retrieve the current key and value associated with the key
    let currKey = keys[i];
    let currVal = JSON.stringify(currFile[currKey]);
    mapList[index][currKey] = currVal;
  }

  return mapList;
}

// Nodes telling the server that they are alive
function creation(call, callback) {
  let nodePort = call.request.portVal;

  aliveNodePorts.push(nodePort);

  UTIL.logAsync(`Server Received alive node ${nodePort}`);
  callback(null);
}

let reduceFinishedCounter = 0;
let sortedStringList;

// Nodes telling the server that they have finished reducing
function reduceFinished(call, callback) {
  UTIL.logAsync("Finished");

  // There was a single node, print it out
  if (call.request.alphabetRangeStart == 0) {
    console.log(call.request.keyVal);
  }else {
    // Increment the finished Counter 
    reduceFinishedCounter += 1;

    // Initialize the sortedStringList if it hasn't been initialized
    if(!sortedStringList) {
      sortedStringList = new Array(aliveNodePorts.length);
    }

    let storeIndex = (call.request.alphabetRangeStart - 65) / (Math.ceil(26 / aliveNodePorts.length) + 1);

    // There was multiple nodes, concat, then print it out
    if(Object.keys(call.request.keyVal) != 0) {
      sortedStringList[storeIndex] = JSON.stringify(call.request.keyVal) + "\n";
    }

    if (reduceFinishedCounter == aliveNodePorts.length) {
      // Concatenate the strings together
      let printString = "";

      for(let i = 0; i < aliveNodePorts.length; i++) {
        if (sortedStringList[i]) {
          // ------------- If anything broke delete code between lines -----------
          console.log(JSON.parse(sortedStringList[i]));
          let sortedJSONList = JSON.parse(sortedStringList[i]);
          Object.entries(sortedJSONList).forEach(element =>{
              printString += element[0] +"\n" + element[1] +"\n";
          });
          // ---------------------------------------------------------------------
          //printString += sortedStringList[i] + "\n";
        }
      }

      FS.writeFileSync('text.json', printString);

      reduceFinishedCounter = 0;
    }
  }
  callback(null);
}

const grpcNodeServer = new grpc.Server();
grpcNodeServer.addService(nodeProto.ServerRequests.service, {
    sort : sort,
    creation : creation,
    reduceFinished : reduceFinished
});
grpcNodeServer.bind(`0.0.0.0:${SERVER_GRPC_PORT}`, grpc.ServerCredentials.createInsecure());
grpcNodeServer.start();
