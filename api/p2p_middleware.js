'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
var WebTorrent = require('webtorrent-hybrid')
let CLIENT = new WebTorrent();


// Getting a torrent from a torrentId which can be of form hashInfo or magnetURL, also other see WebTorrent doc.
async function addTorrent(torrentId){
    let torrent = CLIENT.add(torrentId);
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
async function downloadSeed(torrentId){
    let torrent = CLIENT.add(torrentId);
    UTIL.logAsync("Client: ", CLIENT.nodeId, " Added torrent: ", torrent.infoHash)

    torrent.on('done', async () => {
        UTIL.logAsync('Torrent download finished.')
        let torrent = await CLIENT.seed(buffer)
        UTIL.logAsync("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.infoHash);
      });
}


module.exports = {
    seedTorrent,
    addTorrent,
    downloadSeed,
};

