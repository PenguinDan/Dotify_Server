'use strict'

//Importing modules
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const UTIL = require('./helper/utilities');
const CONST = require('./helper/constants');

// File constants
const SONG = 0;
const ARTIST = 1;
const ALBUM = 2;

function search(match, jsonObj, resultsList) {
    for(let item in jsonObj) {
        if(item.toLowerCase().includes(match)) {
            let dict = {};
            dict[item] = jsonObj[item];
            // Get a mapping of the item title to the guid
            resultsList.push(dict);
        }
    }
}

async function query(req, res) {
    // Authenticate the application
    await UTIL.authenticateApp(req).then(async (result) => {
        // Retrieve the query criteria
        let searchQuery = req.query.search.toLowerCase();

        if (!searchQuery) {
            throw new UTIL.RequestError(CONST.BAD_REQUEST, "Empty search query");
        }

        // Retrieve the song list
        let songList = await FS.readFileAsync(CONST.SONG_DATABASE_FILE);
        let songJson = JSON.parse(songList);

        let songQueryResult = new Array(3);
        for (let it = 0; it < 3; it++) {
            songQueryResult[it] = new Array();
        }

        search(searchQuery, songJson, songQueryResult[SONG]);

        return [searchQuery, songQueryResult];
    }).then(async (result) => {
        let searchQuery = result[0];
        let songQueryResult = result[1];

        let artistList = await FS.readFileAsync(CONST.ARTIST_DATABASE_FILE);
        let artistJson = JSON.parse(artistList);

        search(searchQuery, artistJson, songQueryResult[ARTIST]);

        return [searchQuery, songQueryResult];

    }).then(async (result) => {
        let searchQuery = result[0];
        let songQueryResult = result[1];

        let albumList = await FS.readFileAsync(CONST.ALBUM_DATABASE_FILE);
        let albumJson = JSON.parse(albumList);

        search(searchQuery, albumJson, songQueryResult[ALBUM]);

        return res.status(CONST.OK).json({
            "song" : songQueryResult[SONG],
            "artist" : songQueryResult[ARTIST],
            "album" : songQueryResult[ALBUM]
        });

    }).catch((err) => {
        UTIL.logAsync(`Error Message: ${err.message}`)
        return res.status(err.code).json({'message' : err.message})
    })
}

//Exports for the modules.
module.exports = {
	query
};
