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
function getSong(songDataFilePath){
    const decoder = new Lame({
        "output": "buffer"
    }).setFile(songDataFilePath);
    return decoder;
}

//Returns the song data for the give song id.
let getSongBuffer = async function(msg){
  UTIL.logAsync("Retrieving buffer for :" + msg);
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
  UTIL.logAsync("Return buffer created for :" +msg);
  await decoder.decode();
  return decoder.getBuffer();
}

module.exports = {
	getSongBuffer
};
