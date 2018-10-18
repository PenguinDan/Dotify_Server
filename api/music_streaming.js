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
function getSong(songId){
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


	let decoder = getSong(songDataDir);

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
