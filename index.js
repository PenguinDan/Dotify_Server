'use strict'

// Modules
const LAME = require("node-lame").Lame;
const UTIL = require('./api/helper/utilities');
const CONSTANTS = require('./api/helper/constants');
const MONGOOSE = require('mongoose');
const HTTP = require('http');
const HTTPS = require('https');
const EXPRESS = require('express');
const ROUTES = require('./api/router');
const BODY_PARSER = require('body-parser');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const HELMET = require('helmet');
const DGRAM = require('dgram');
const MUSIC_STREAM = require('./api/music_streaming');
const RECOMMENDER = require('./api/recommender');
const CHUNKS = require('buffer-chunks');
const HASHMAP = require('hashmap');
const USER_MIDDLEWARE = require('./api/user_middleware');
const MUSIC_MIDDLEWARE = require('./api/music_middleware');
const { spawn } = require('child_process');

// Setup Express routes
const HTTPAPP = EXPRESS();
const HTTPSAPP = EXPRESS();
const MUSIC_STREAM_SOCKET = DGRAM.createSocket('udp4');
const RECOMMENDER_SOCKET = DGRAM.createSocket('udp4');

// File Constants
const ONE_YEAR = 31536000000;
const HTTP_PORT = 80;
const SECURE_PORT = 443;
const MUSIC_STREAM_PORT = 40000;
const RECOMMENDER_PORT = 50000;
const CERT_LOC = '/etc/letsencrypt/live/www.dotify.online/';
const ROUTER = ROUTES(EXPRESS.Router());

// Before anything, make sure to run any method that hasn't finished
// running because of a server crash
async function crashRecover(){
  // Open the request logs json file
  let requestLogs = await FS.readFileAsync(CONSTANTS.REQUEST_LOG_FILEPATH);
  // Turn the request log into a hash map object
  requestLog = new HASHMAP(JSON.parse(requestLog));
  // Retrieve all of the values from the hashmap
  let uuidKeys = requestLog.keys();
  // Do each request
  for (let uuid of uuidKeys){
    request = requestLog.get(uuid);
    // Retrieve the request type of the logged request
    let requestType = request.requestType;
    // Depending on the request type, send the request the the appropriate
    // location
    switch(requestType) {
      case CONSTANTS.CREATE_ACCOUNT_REQUEST:{
        USER_MIDDLEWARE.createUser(request, null);
      }
      break;
      case COSNTANTS.UPDATE_USER_PASSWORD_REQUEST:{
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


// UDP: receives a message with the song id to be sent back as UDP stream.
MUSIC_STREAM_SOCKET.on('message', async function(msg, rinfo){
  UTIL.logAsync(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  //FOR TESTING CONNECTION _ DELETE AFTER TESTING.
  MUSIC_STREAM.sendSongData(msg)
  .then(function(result){
      if(!result){
        UTIL.logAsync("The song buffer was null.");
        return;
      }
      UTIL.logAsync(Buffer.isBuffer(result));
      //Splits the buffer into seperate datagrams to send.
      const bufferSplit = 8000;
      let list = CHUNKS(result, bufferSplit);
      let chunkCount = (list.length).toString() + 'x';

      let indexLength = Buffer.from(chunkCount);
      MUSIC_STREAM_SOCKET.send(indexLength, 0, 16, rinfo.port, rinfo.address, function(err, bytes) {
        if (err){
          UTIL.logAsync('Error attempting to send song data length.\n' + result);
          UTIL.logAsync(err);
          throw err
        };
        UTIL.logAsync('Length of the message ' + rinfo.address +':'+ rinfo.port);
      });

     UTIL.logAsync('Sending song bytes to Client');
     let it = 0;
     for(var i = 0; i < list.length;i++){
       //UDP: Sends the song buffer for a message to the address that it received the request from.
       MUSIC_STREAM_SOCKET.send(list[i], 0, bufferSplit, rinfo.port, rinfo.address, function(err, bytes) {
         if (err){
           UTIL.logAsync('Error attempting to send song data steam.\n' + list[i].length);
           UTIL.logAsync(err);
           throw err
         }
       });
        it += 1;
    }
    UTIL.logAsync(`Iteration Value : ${it}`);
  })
  .catch(function(error){
    UTIL.logAsync(error);
    throw error;
  });
});


//The Server socket is listening on specified port.
MUSIC_STREAM_SOCKET.on('listening', () => {
  const address = MUSIC_STREAM_SOCKET.address();
  UTIL.logAsync(`server listening ${address.address}:${address.port}`);
});

RECOMMENDER_SOCKET.on('message', function(message, rinfo){

});


MUSIC_STREAM_SOCKET.bind(MUSIC_STREAM_PORT);
RECOMMENDER_SOCKET.bind(RECOMMENDER_PORT);
