'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
var WebTorrent = require('webtorrent-hybrid');

let CLIENT = new WebTorrent();
const DGRAM = require('dgram');
const SERVER = DGRAM.createSocket('udp4');

let PORT = 49888; 
let HOST = '68.107.39.84';
// Getting a torrent from a torrentId which can be of form hashInfo or magnetURL, also other see WebTorrent doc.
async function addTorrent(req, res){
    let torrentId = req.query.torrentid;
    let torrent = await CLIENT.add(torrentId);
    UTIL.logAsync("Client: ", CLIENT.nodeId, " Added torrent: ", torrent.infoHash);

    torrent.on('done', function () {
        UTIL.logAsync('Torrent download finished.');
      });
}

// Seeds the torrent for the client which belongs to this process.
async function seedTorrent(buffer){
    let torrent = await CLIENT.seed(buffer)
    UTIL.logAsync("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.infoHash);
}

// Downloads and seeds a torrent after it is finished downloading.
async function downloadSeed(req, res){
    	try{
		UTIL.logAsync("Downloading and seeding torrent");
	let torrentId = req.query.torrentid;
    	if(!torrentId){
		UTIL.logAsync("Torrent id  requested was invalid.")
       		 return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Torrent Id  requested was invalid"});
		}

		//let store_chunk = function(){

		// }
		// opts = {
		// 	"store": store_chunk
		// }
    	let torrent = await CLIENT.add(torrentId);
    	UTIL.logAsync("Client: " +  CLIENT.nodeId +  " Added torrent: " + torrent.infoHash)

		// Adding and seeding the torrent is finished.
    	torrent.on('done', async function(){
       		 UTIL.logAsync('Torrent download finished.')
			
			// Sending the torrent to the client that requested to access it.
        	SERVER.send(torrent.torrentFile, 0, message.length, PORT, HOST, function(err, bytes) {
            	if (err) throw err;
           	 console.log('UDP message sent to ' + HOST +':'+ PORT);
        	});

        	let torrent = await CLIENT.seed(buffer)
        	UTIL.logAsync("Client: " + CLIENT.nodeId +  " Added seeded torrent: " + torrent.infoHash);
      	});
	}catch(err){
	   UTIL.logAsync(err.message);
           res.status(err.code).json({message: err.message});
      	  
	}
}

//Exports for the modules.
module.exports = {
    addTorrent,
    seedTorrent,
    downloadSeed,
};

