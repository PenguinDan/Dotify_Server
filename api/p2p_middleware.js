'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
var WebTorrent = require('webtorrent-hybrid')
let CLIENT = new WebTorrent();
const DGRAM = require('dgram');
const SERVER = DGRAM.createSocket('udp4');

let PORT = 49182;
let HOST = 
// Getting a torrent from a torrentId which can be of form hashInfo or magnetURL, also other see WebTorrent doc.
async function addTorrent(req, res){
    let torrentId = req.query.torrentid;
    let torrent = await CLIENT.add(torrentId);
    UTIL.logAsync("Client: ", CLIENT.nodeId, " Added torrent: ", torrent.infoHash)

    torrent.on('done', function () {
        UTIL.logAsync('Torrent download finished.')
      });
}

// Seeds the torrent for the client which belongs to this process.
async function seedTorrent(buffer){
    let torrent = await CLIENT.seed(buffer)
    UTIL.logAsync("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.infoHash);
}

// Downloads and seeds a torrent after it is finished downloading.
async function downloadSeed(req, res){
    let torrentId = req.query.torrentid;
    let torrent = await CLIENT.add(torrentId);
    UTIL.logAsync("Client: ", CLIENT.nodeId, " Added torrent: ", torrent.infoHash)

    torrent.on('done', async () => {
        UTIL.logAsync('Torrent download finished.')

        SERVER.send(torrent.torrentFile, 0, message.length, PORT, HOST, function(err, bytes) {
            if (err) throw err;
            console.log('UDP message sent to ' + HOST +':'+ PORT);
            client.close();
        });

        let torrent = await CLIENT.seed(buffer)
        UTIL.logAsync("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.infoHash);
      });
}

//Exports for the modules.
module.exports = {
    seedTorrent,
    downloadSeed,
};

