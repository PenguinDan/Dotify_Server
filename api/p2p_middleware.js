'use strict'
//Importing modules
const FS = require('fs');
let CLIENT = new WebTorrent();
const UTIL = require('./helper/utilities');
var WebTorrent = require('webtorrent-hybrid')


//Seeds the torrent for the client which belongs to this process.
async function seedTorrent(buffer){
    CLIENT.seed(buffer, torrent => {
            UTIL.logAsync("Client: ", CLIENT.nodeId, " Added seeded torrent: ", torrent.magnetURI);
        });
}

//Getting a torrent from a torrentId which can be of form hashInfo or magnetURL, also other see WebTorrent doc.
async function addTorrent(torrentId){
    CLIENT.add(torrentId, torrent => {
        UTIL.logAsync("Client: ", CLIENT.nodeId, " Added torrent: ", torrent.infoHash)
        torrent.on('done', function () {
            UTIL.logAsync('Torrent download finished.')
          });
    });
}


module.exports = {
    seedTorrent,
    addTorrent,
};

