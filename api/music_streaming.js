'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');
var dateTime = require('node-datetime');
const Lame = require("node-lame").Lame;


function songIdDataDir(songId){
	return `${CONSTANTS.SONG_DATA_DIRECTORY}${songId}.mp3`
}
//Returns Lame object for converting mp3 to buffer.
async function getSong(songId){
    const decoder = new Lame({
        "output": "buffer"
    }).setFile(songId);
    return decoder;
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
        /*let songDataJson = await FS.readFileAsync(songDataDir)
		.then(function(result){
			let songDataJson = JSON.parse(result);
            UTIL.logAsync("The song data json for song with song id "+ songId + " was retrieved successfully!");
			return JSON.stringify(songDataJson['music']);
		})
		.catch(function(err){
			let errorMessage = "The song data json for song with song id " + songId + " could not be retrieved.";
			throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
		});*/
		let decoder = await getSong(songDataDir)
        .then(function(result){
            return result;
        })
        .catch(function(error){
            UTIL.logAsync("Error in constructing LAME object for song decoder.");
            UTIL.logAsync(error);
        });
    

    	let songBuffer = await decoder.decode()
        .then(function(result){
            // Decoding finished
            const buffer = decoder.getBuffer();
            console.log("Song decoding to buffer complete.");
            return buffer;
        })
        .catch(function(error){
            // Something went wrong
            throw error;
        });
		return songBuffer;
    }catch(error){
        UTIL.logAsync(error.message);
        return null;
    }

}

module.exports = {
	sendSongData,
};
