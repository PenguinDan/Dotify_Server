//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');


//Returns the directory for the song information.
function songIdInfoDir(){
	return `${CONSTANTS.SONG_DATA_DIRECTORY}`
}

//Returns the search results for the request.
let getSearchResults = async function(req, res){
    try{
        //Setting song id from request.
		let search = req.query.search;
		//Setting directory for song list.
        let songDir = songIdInfoDir() + 'songlist.txt';
        //Setting directory for artist list.
		let artistDir = songIdInfoDir() + 'artistlist.txt';
        UTIL.logAsync(songDir);
        
 		//Checking if the search param is null;
		if(!search){
			let errorMessage = "Search param requested was invalid.";
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
		}
 		//Authenticating application.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});

        //Getting the song list text file for the search results.
		let songListFile = await FS.readFileAsync(songDir)
		.then(function(result){
			UTIL.logAsync("The song list .txt file was retrieved successfully!");
			return result;
		})
		.catch(function(err){
			let errorMessage = "The song list .txt file could not be retrieved.";
			throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
        });
        
        //Getting the artist list text file for the search results.
		let artistListFile = await FS.readFileAsync(artistDir)
		.then(function(result){
			UTIL.logAsync("The artist list .txt file was retrieved successfully!");
			return result;
		})
		.catch(function(err){
			let errorMessage = "The artist list .txt file could not be retrieved.";
			throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
        });
        //Parsing list file.
        var songList = songListFile.toString().split(",");
        var songSearchResults = [];
        UTIL.logAsync(search);
        //Adding search results for the songs.
        for(var i = 0; i < songList.length; i++){
            if(songList[i].match(search)){
                songSearchResults.push(songList[i].toString().split(":")[0]);
            }
        }

        //Parsing list file.
        var artistList = artistListFile.toString().split(",");
        var artistSearchResults = [];

        for(var i = 0; i < artistList.length; i++){
            if(artistList[i].match(search)){
                artistSearchResults.push(artistList[i].split(":")[0]);
            }
        }

        let returnList = {
            songs : {
                
            }
        }



    }catch(error){
        UTIL.logAsync(error.message);
        return res.status(error.code).json({message: error.message});
    }
}
//Exports for the modules.
module.exports = {
	getSearchResults,
};