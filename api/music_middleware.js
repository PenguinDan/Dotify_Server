 'use strict'
//Importing modules
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');
const UUID = require('uuid/v4');

 //Delete playlist for the user.
let deletePlaylist = async function(req, res, isFromClient = false){
	// Create a unique identifier for the current request
	if (isFromClient) {
		var uniqueId = UUID();
		// Log the request
		await UTIL.addRequestLog(uniqueId, req, CONSTANTS.DELETE_PLAYLIST_REQUEST);
	}

	// Authenticate whether the client is authorized to send the request
	UTIL.authenticateApp(req).then(async (result) => {
		let username = req.body.username;
		let playlist = req.body.playlist;
		if(!username || !playlist) {
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "Username and playlist required.");
		}

		// Retrieve the user file
		username = username.toLowerCase();
		let userJson = await UTIL.getUserDataFile(username);

		// Delete the playlist key and values associated with it
		delete userJson['playlistTitles'][playlist];

		// Save the file
		UTIL.saveUserDataFile(userJson, username);

		if (isFromClient) {
			UTIL.removeRequestLog(uniqueId);
			return res.status(CONSTANTS.OK).json({message : "Playlist sucessfully deleted"});
		}
	}).catch((err) => {
		UTIL.logAsync(`Error in deletePlaylist.\nError Message: ${err.message}`);
		if (isFromClient) {
			UTIL.removeRequestLog(uniqueId);
			return res.status(err.code).json({message : err.message});
		}
	});
 }


 //Create playlist for the user.
let createPlaylist = async function(req, res, isFromClient = false){
	// Create a unique identifier for the current request
	if (isFromClient){
		var uniqueId = UUID();
		// Log the request
		await UTIL.addRequestLog(uniqueId, req, CONSTANTS.CREATE_PLAYLIST_REQUEST);
	}

	// Authenticate whether the client is authorized to sent the request
	UTIL.authenticateApp(req).then(async (result) => {
		// Check whether the client has sent the necessary body items
		if (!req.body.playlist || !req.body.username) {
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "Username and playlist must be specified");
		}

		let playlistName = req.body.playlist;
		let username = req.body.username.toLowerCase();

		// Retrieve the user's json file
		let userJson = await UTIL.getUserDataFile(username);

		// Check whether a playlist already exists with the current name
		if (userJson["playlistTitles"][playlistName]) {
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "Playlist name already exists for the user");
		}

		// If we were able to reach to this point, it means that all the checks have been passed
		userJson["playlistTitles"][playlistName] = [];
		
		// Save the user file
		await UTIL.saveUserDataFile(username, userJson);

		return res.status(CONSTANTS.CREATED).json({message : "Playlist created successfully."});

		}).catch((error) => {
		UTIL.logAsync(`Error in CreatePlaylist.\nError Message: ${error.message}`);
		if (isFromClient) {
			// Remove the saved request log
			UTIL.removeRequestLog(uniqueId);
			return res.status(error.code).json({message : error.message});
		}
	});
 }

 // Retrieves all of the playlist titles for a specifc user
let getAllPlaylistTitle = function(req, res){
	UTIL.logAsync("Calling getAllPlaylistTitle method");
	// Authenticate whether the client is authorized to sent the request
	UTIL.authenticateApp(req).then(async (result) =>{
		// Check if the request contains a username
		if (!req.get("username")) {
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "Username must be defined");
		}

		// Retrieve a list of playlist for the user
		let username = req.get("username").toLowerCase();
		let userJson = await UTIL.getUserDataFile(username);

		// Get the list of all of the playlist titles
		let playlistTitles = Object.keys(userJson["playlistTitles"]);

	 	UTIL.logAsync("Returning from getAllPlaylistTitle method");
		return res.status(CONSTANTS.OK).json({
			message : "Playlist retrieved successfully",
			playlists : playlistTitles
		});
	}).catch((err) => {
		UTIL.logAsync(`Error in getAllPlaylistTitle.\nError Message: ${err.message}`);
		return res.status(err.code).json({message: err.message});
	})
}

 // Retrieves all of the specific songs for a playlist belonging for a user
let getPlaylist = function(req, res){
	UTIL.logAsync("Calling getPlaylist Method");
	// Check whether the request contains the proper credentials
 	UTIL.authenticateApp(req).then(async (result) => {
		 // Check if we have all of the correct information stored in the 
		 // request header
		 let username = req.get('username');
		 let playlist = req.get('playlist');
		 if(!username || !playlist) {
			 throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, 'Username required in the request')
		 }

		 let userJson = await UTIL.getUserDataFile(username.toLowerCase());

		 // Get the list of songs for a playlist
		 let songs = userJson['playlistTitles'][playlist];

		// Return
		UTIL.logAsync("Returning from getPlaylist");
		 return res.status(CONSTANTS.OK).json({
			 message : "Songs for playlist retrieved successfully",
			 songList : songs
		 });
	}).catch((err) => {
		UTIL.logAsync(`Error in getPlaylist.\nError Message: ${err.message}`);
		res.status(err.code).json({message: err.message});1
	})
}

// Adds a specific song to a playlist
let addSongToPlaylist = function(req, res, isFromClient = false){
	// Check whether the request contains the proper credentitals
	UTIL.authenticateApp(req).then(async (result) =>{
		// Check if we have all of the correct information stored in the 
		// request body
		if (!req.body.username || !req.body.guid || !req.body.playlist) {
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "Request body misconfigured");
		}
		
		let userJson = UTIL.getUserDataFile(req.body.username.toLowerCase());
		// Retrieve the GUID file
		return userJson;
	}).then(async (result) => {
		// Retrieve the file that contains the mapping for every song
		let guidMapping = await FS.readFileAsync(CONSTANTS.GUID_MAPPING_FILE);
		guidMapping = JSON.parse(guidMapping);

		return {
			jsonFile : result,
			songInfo : guidMapping[req.body.guid]
		};
	}).then((result)=> {
		let userJson = result.jsonFile;
		let songInfo = result.songInfo;

		if (!userJson["playlistTitles"][req.body.playlist]){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "Playlist for user does not exist");
		}

		// Add the requested song to the user's playlist
		userJson["playlistTitles"][req.body.playlist].push(
			{
				"songTitle" : songInfo.songTitle,
				"guid" : req.body.guid,
				"album" : songInfo.album,
				"artist" : songInfo.artist
			}
		);

		// Save the now updated user file
		UTIL.saveUserDataFile(req.body.username.toLowerCase(), userJson);

		return res.status(CONSTANTS.OK).json({message : "Song added successfully"});

	}).catch((err) => {
		UTIL.logAsync(`Error Message: ${err.message}`);
		return res.status(err.code).json({
			"message" : err.message
		});
	});
}

//Deleting the song from the playlist json file.
 let deleteSongFromPlaylist = async function(req, res, isFromClient = false){
	let playlistName =  req.query.playlist;
	let songId = req.query.songid;
	let username = req.query.username.toLowerCase();
	let playlistDir = userPlaylistDir(username, playlistName);
	if (isFromClient){
		// Create a unique identifier for the current request
		var uniqueId = UUID();
	}
	try{
		//Checking if the playlist name is null.
		if(!playlistName){
			UTIL.logAsync("Playlist name requested was invalid.")
			return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Playlist name requested was invalid"});
		}
		//Checking if the song id is null;
		if(!songId){
			let errorMessage = "Song ID name requested was invalid.";
			return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Song ID name requested was invalid"});
		}
 		//Authenticating application.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});
		if (isFromClient) {
			await UTIL.addRequestLog(uniqueId, req, CONSTANTS.DELETE_SONG_FROM_PLAYLIST_REQUEST);
		}
 		//Reading the playlist JSON through the playlist.
		let playlistJson = await FS.readFileAsync(playlistDir)
			.then(function(result){
				let playlistJson = JSON.parse(result);
				UTIL.logAsync("The user playlist "+ playlistName + " was retrieved successfully!");
				return playlistJson;
			})
			.catch(function(err){
				let errorMessage = "Json file for " + playlistName + " could not be retrieved.";
				throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
			});

 		let inPlaylist = false;
		//Deleting the playlist from the user json.
		for(var i = 0; i < playlistJson['songs'].length; i++){
			if(playlistJson['songs'][i]['songid'] == songId){
				UTIL.logAsync("Removing song " + songId + " from the playlist!");
				playlistJson['songs'].splice(i,1);
				inPlaylist = true;
				break;
			}
		}
		//Checks if the playlist is null.
 		if(!inPlaylist){
			let errorMessage = " The song was not in the playlist.";
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
		}
 		//Updating the song count for playlist JSON.
		playlistJson['song_count'] -= 1;
 		// Updating the playlist to include the new song, writing to json.
		await FS.writeFile(playlistDir, JSON.stringify(playlistJson),(err) => {
			if (err){
				let errorMessage = "Json file for " + playlistName + " could not be saved.";
				throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
			}
			UTIL.logAsync("Playlist file save request for " + playlistName + " was a success!");
			if (isFromClient) {
				// Remove request log
				UTIL.removeRequestLog(uniqueId);
				return res.status(CONSTANTS.OK).json(playlistJson);
			} else {
				UTIL.logAsync("Successfully finished log request for " + username + " in detelePlaylist");
			}
			});
	}catch(err){
		UTIL.logAsync(err.message);
		if (isFromClient){
			// Remove request log
			UTIL.removeRequestLog(uniqueId);
			res.status(err.code).json({message: err.message});
		}
	}
}
//Gets requested song information.
 let getSong = async function(req, res){
	try{
		//Setting song id from request.
		let songId = req.query.songid;
		//Gets the directory for the song info of given song id.
		let songInfoDir = songIdInfoDir(songId);
 		//Checking if the song id is null;
		if(!songId){
			let errorMessage = "Song ID name requested was invalid.";
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
		}
 		//Authenticating application.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});
 		//Getting the song info JSON for a song through song id.
		let songInfoJson = await FS.readFileAsync(songInfoDir)
			.then(function(result){
				let songInfoJson = JSON.parse(result);
				UTIL.logAsync("The song info for song with song id "+ songId + " was retrieved successfully!");
				return songInfoJson;
			})
			.catch(function(err){
				let errorMessage = "The song info for song with song id " + songId + " could not be retrieved.";
				throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
			});
 		return res.status(CONSTANTS.OK).json(songInfoJson);
 	}catch(err){
		UTIL.logAsync(err.message);
		res.status(err.code).json({message: err.message});
	}
}



//Deleting the song from the artist json file.
let getArtist = async function(req, res, isFromClient = false){
	let artistName =  req.query.artist;
	let artistDir = `${CONSTANTS.SONG_DATA_DIRECTORY}` + 'artistlist.txt';
	if (isFromClient){
		// Create a unique identifier for the current request
		var uniqueId = UUID();
	}
	try{
		//Checking if the artist name is null.
		if(!artistName){
			UTIL.logAsync("Artist name requested was invalid.")
			return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Artist name requested was invalid"});
		}
 		//Authenticating application.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});
		if (isFromClient) {
			await UTIL.addRequestLog(uniqueId, req, COSNTANTS.DELETE_SONG_FROM_PLAYLIST_REQUEST);
		}


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
		
		
		//Parsing artist list file.
        var artistList = artistListFile.toString().split("~");
        var artistSongs = [];
        //Adding search results for the artist.
        for(var i = 0; i < artistList.length; i++){
			//Checks if the artist matches any results. 
            if(artistList[i].toLowerCase().match(artistName.toLowerCase())){
				//Getting song id's from the artist.
				var temp = artistList[i].split(":")[1];
				//Getting list of the id's
				var iter = temp.split(";")
				for(var l = 0; l < iter.length;l++){
					//Pushes the results to the artist results.
					artistSongs.push(iter[l]);
				}
				break;
            }
		}
		//If there are no results
		if(!artistSongs[0]){
			let errorMessage = "There are no results with artist name";
			throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
		}
		
		var listOfSongs = []
		UTIL.logAsync(artistSongs);
		for(var i = 0; i < artistSongs.length; i++){
			//Getting the songs info JSON for a song through song id.
			let songInfoJson = await FS.readFileAsync(songIdInfoDir(artistSongs[i]))
				.then(function(result){
					let songInfoJson = JSON.parse(result);
					UTIL.logAsync("The song info for song with song id "+ artistSongs[i] + " was retrieved successfully!");
					return songInfoJson;
				})
				.catch(function(err){
					let errorMessage = "The song info for song with song id " + artistSongs[i] + " could not be retrieved.";
					throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
				});
			//Getting fields to push to the user for displaying the list of songs.
			let songId = artistSongs[i];
			let songTitle = songInfoJson['title'];
			let songInfo = {"song_info" :songTitle, songId}
			
			listOfSongs.push(songInfo);
		}
		//Creating JSON object from artist songs.
		var artistSongs = {
			'songs': listOfSongs,
			'artist': [artistName],

		}
		return res.status(CONSTANTS.OK).json(artistSongs);
	}catch(err){
		UTIL.logAsync(err.message);
		if (isFromClient){
			// Remove request log
			UTIL.removeRequestLog(uniqueId);
			res.status(err.code).json({message: err.message});
		}
	}
}

//Exports for the modules.
 module.exports = {
	createPlaylist,
	getAllPlaylistTitle,
	getPlaylist,
	deletePlaylist,
	addSongToPlaylist,
	deleteSongFromPlaylist,
	getSong,
	getArtist,
};
