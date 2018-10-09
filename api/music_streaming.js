'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');
var dateTime = require('node-datetime');

function songIdDataDir(songId){
	return `${CONSTANTS.SONG_MUSIC_DIRECTORY}/${songId}.json`
}

//Returns the song data for the give song id.
let sendSongData = async function(msg){
    try{
        //Setting song id from request.
		let songId = msg;
		//Gets the directory for the song info of given song id.
		let songDataDir = songIdDataDir(songId);
        //Checking if the song id is null;
		if(!songId){
			let errorMessage = "Song ID name requested was invalid.";
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
        }

        //Getting the song data JSON for the song.
        let songDataJson = await FS.readFileAsync(songDataDir)
		.then(function(result){
			let songDataJson = JSON.parse(result);
            UTIL.logAsync("The song data json for song with song id "+ songId + " was retrieved successfully!");
            UTIL.logAsync(JSON.stringify(songDataJson));
			return JSON.stringify(songDataJson['music']);
		})
		.catch(function(err){
			let errorMessage = "The song data json for song with song id " + songId + " could not be retrieved.";
			throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
		});
		return songDataJson;
    }catch(error){
        UTIL.logAsync(error.message);
        return null;
    }

}

module.exports = {
	sendSongData,
};
