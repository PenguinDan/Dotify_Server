'use strict'

// Modules
const MONGOOSE = require('mongoose');
const HTTP = require('http');
const HTTPS = require('https');
const EXPRESS = require('express');
const ROUTES = require('./api/router');
const BODY_PARSER = require('body-parser');
const FS = require('fs');
const HELMET = require('helmet');
const DGRAM = require('dgram');
const MUSIC_STREAM = require('./api/music_streaming');
const RECOMMENDER = require('./api/recommender');


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

HTTPSAPP.use(BODY_PARSER.urlencoded({extended: true}));
HTTPSAPP.use(BODY_PARSER.json());
HTTPSAPP.use('/', ROUTER);
HTTPSAPP.use(EXPRESS.static(__dirname + '/public'));

let options = {
  key: FS.readFileSync(CERT_LOC + 'privkey.pem'),
  cert: FS.readFileSync(CERT_LOC + 'fullchain.pem'),
  ciphers: cipher
};

HTTPS.createServer(options, HTTPSAPP).listen(SECURE_PORT);
HTTP.createServer(HTTPAPP).listen(HTTP_PORT);


// Setup UDP Sockets
MUSIC_STREAM_SOCKET.on('message', function(message, rinfo){

});

RECOMMENDER_SOCKET.on('message', function(message, rinfo){

});


MUSIC_STREAM_SOCKET.bind(MUSIC_STREAM_PORT);
RECOMMENDER_SOCKET.bind(RECOMMENDER_PORT);
