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
		let search = req.query.search.toLowerCase();
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
        //Parsing song list file.
        var songList = songListFile.toString().split("~");
        var songSearchResults = [];
        var songId;
        //Adding search results for the songs.
        for(var i = 0; i < songList.length; i++){
            if(songList[i].toLowerCase().match(search)){
                //Parsing song name.
                let songName = songList[i].toString().split(":")[0].replace("\n","");

                //Getting the song id for the songs found.
                songId = songList[i].toString().split(":")[1];
                UTIL.logAsync("------SONG ID------");
                UTIL.logAsync(songId);

                //Pushes the song to the search results.
                songSearchResults.push({"song_info" :songName, songId});
                //If the length of results is greater, then 10, stop adding results.
                if(songSearchResults.length > 10){
                    break;
                }
            }
        }

        if(!songId){
            UTIL.logAsync("Song id is null");
            songId = "9999999";
        }
        //Parsing artist list file.
        var artistList = artistListFile.toString().split("~");
        var artistSearchResults = [];
        //Adding search results for the artist.
        for(var i = 0; i < artistList.length; i++){
            //Checks if the artist matches any results. 
            if(artistList[i].toLowerCase().match(search) || artistList[i].match(songId)){
                //Parses artist name.
                let artistName = artistList[i].split(":")[0].replace("\n","");
                //Pushes the results to the artist results.
                artistSearchResults.push(artistName);
                //If the length of results is greater, then 10, stop adding results.
                if(artistSearchResults.length > 10){
                    break;
                }
            }
        }

        let returnList = {
            'songs' : songSearchResults,
            'artist': artistSearchResults,

        }
        return res.status(CONSTANTS.OK).json(returnList);


    }catch(error){
        UTIL.logAsync(error.message);
        return res.status(error.code).json({message: error.message});
    }
}
//Exports for the modules.
module.exports = {
	getSearchResults,
};