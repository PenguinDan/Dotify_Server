 'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');
const UUID = require('uuid/v4');
var dateTime = require('node-datetime');

//Returns the users playlist directory.
function userPlaylistDir(username, playlist){
	return `${CONSTANTS.USER_DATA_DIRECTORY}${username}/playlists/${playlist}.json`;
}

//Returns the directory for the song information.
function songIdInfoDir(songId){
	return `${CONSTANTS.SONG_INFO_DIRECTORY}/${songId}.json`
}
 //Delete playlist for the user.
let deletePlaylist = async function(req, res, isFromClient = false){
	// Create a unique identifier for the current request
	if (isFromClient){
		var uniqueId = UUID();
	}
	try{
		let playlistName = req.query.playlist;
		//Get the id of the user from req.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});
		if (isFromClient){
                	// Create Request Log for the current request
                	await UTIL.addRequestLog(uniqueId, req, CONSTANTS.DELETE_PLAYLIST_REQUEST);
		}
		let username = req.query.username.toLowerCase();
		//Retrieving the userJson for the requesting user.
		let userJson = await UTIL.getUserDataFile(username)
			.then(function(result){
				return result;
			})
			.catch(function(error){
				//The JSON file for the user did not exist.
				throw error;
			});

		//Checking if the playlist request name is null.
		if(!playlistName){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "The delete playlist was not given a valid playlist name.");
		}
		//Checks if the user playlist contains the playlist.
 		if(!userJson['playlist_titles'].includes(playlistName)){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "The playlist for the user does not exist.");
		}
 		//Deleting the playlist from the user json.
		for(var i = 0; i < userJson['playlist_titles'].length; i++){
			if(userJson['playlist_titles'][i] == playlistName){
				userJson['playlist_titles'].splice(i,1);
			}
		}

 		let playlistDir = userPlaylistDir(username, playlistName)
		//Removing the file that contains the playlist information.
		 await FS.unlink(playlistDir, (err) => {
			if (err){
				let errorMessage = "Json file for " + playlistName + " could not be deleted.";
				throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
			}
			UTIL.logAsync("Playlist file delete request for " + playlistName+ " was a success!");
			return true;
		});
 		//Saving the user.json with the new playlist saved.
		await UTIL.saveUserDataFile(username, userJson)
			.then(function(result){
				if (isFromClient){
					// Remove request log
					UTIL.removeRequestLog(uniqueId);
					//returning user's json file with an 200 status.
					return res.status(CONSTANTS.OK).json(userJson.playlist_titles);
				} else {
					UTIL.logAsync("Successfully finished logged request for" + username + " in deletePlaylist");
				}
			})
			.catch(function(error){
				//The JSON file for the user did not exist.
				throw error;
			});
	}catch(error){
		//Logging error and returning to user.
		UTIL.logAsync(error.message);
		if (isFromClient){
			// Remove request log
			UTIL.removeRequestLog(uniqueid);
			return res.status(error.code).json({message: error.message});
		}
	}
 }
 //Create playlist for the user.
let createPlaylist = async function(req, res, isFromClient = false){
	// Create a unique identifier for the current request
	if (isFromClient){
		var uniqueId = UUID();
	}
	try{
		let playlistName = req.query.playlist;
		let username = req.query.username.toLowerCase();
		UTIL.logAsync("Playlist: " +playlistName);
 		//Get the id of the user from req.
		await UTIL.authenticateApp(req);
		if (isFromClient){
			// Log the request
			await UTIL.addRequestLog(uniqueId, req, CONSTANTS.CREATE_PLAYLIST_REQUEST);
		}
		UTIL.logAsync("Username:" + username);
		//Retrieving the userJson for the requesting user.
		let userJson = await UTIL.getUserDataFile(username)
			.then(function(result){
			return result;
			})
			.catch(function(error){
				//The JSON file for the user did not exist.
				throw error;
			});

		// Checks if the user json is null.
		if(!userJson){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "The username given was null.");
		}

		//Checking if the playlist request name is null.
		if(!playlistName){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "The new playlist name was not specified with request.");
		}
 		if(userJson['playlist_titles'].includes(playlistName)){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST,"The playlist for the user already exist.");
		}
 		let playlistDir = userPlaylistDir(username, playlistName)

		//Setting the date for when the playlist was created.
		var dt = dateTime.create();
		dt.format('m/d/Y');
		let date = new Date(dt.now());
 		//Creating JSON object for the playlist.
		let playlistJson = {
			'name' : playlistName,
			'songs' : [],
			'song_count': 0,
			'created_date': date,
		}
 		// User playlist.json for specified playlist.
		// corresponding with the user's username
		await FS.writeFile(playlistDir, JSON.stringify(playlistJson),(err) => {
			if (err){
				let errorMessage = "Json file for " + playlistName + " could not be saved.";
				throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
			}
			UTIL.logAsync("Playlist file save request for " + playlistName+ " was a success!");
			return true;
			});
 		//Updating the user.json with playlists.
		userJson['playlist_titles'].push(playlistName);
 		//Saving the user.json with the new playlist saved.
		await UTIL.saveUserDataFile(username, userJson)
			.then(function(result){
				if (isFromClient){
					// Remove the request log
					UTIL.removeRequestLog(uniqueId);
					//returning user's json file with an 200 status.
					return res.status(CONSTANTS.OK).json(userJson['playlist_titles']);
				} else {
					UTIL.logAsync("Successfully finished logged request for " + username + " in create playlist");
				}
			})
			.catch(function(error){
				//The JSON file for the user did not exist.
				throw error;
			});
	}catch(error){
		UTIL.logAsync(error.message);
		if (isFromClient){
			// Remove the saved request log
			UTIL.removeRequestLog(uniqueId);
			return res.status(error.code).json({message: error.message});
		}
	}
 }
 //get a list of playlist from user.
let getPlaylistList = async function(req, res){
	try{
		//Get the id of the user from req.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});
		//Retrieving the userJson for the requesting user.
		let userJson = await UTIL.getUserDataFile(req.query.username.toLowerCase())
			.then(function(result){
			return result;
		})
		.catch(function(error){
			//The JSON file for the user did not exist.
			throw error;
		});
		if(!userJson){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "The username given was null.");
		}
		//returning user's playlist_list with an 200 status.
		return res.status(CONSTANTS.OK).json(userJson.playlist_titles);
	}catch(error){
		UTIL.logAsync(error.message);
		return res.status(error.code).json({message: error.message});
	}
}
 //get a playlist for user.
let getPlaylist = async function(req, res){
 	try{
		let username = req.query.username.toLowerCase();
		if(!username){
			throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, "The username given was null.");
		}
		let playlistName =  req.query.playlist;
		let playlistDir = userPlaylistDir(username, playlistName)

		//Checking if the playlist name is null.
		if(!playlistName){
			UTIL.logAsync("Playlist name requested was invalid.")
			return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Playlist name requested was invalid"});
		}
		//Authenticating the application from req.
		await UTIL.authenticateApp(req)
			.then(function(result){})
			.catch(function(error){
				throw error;
			});
		await FS.readFileAsync(playlistDir)
				.then(function(result){
					let playlistJson = JSON.parse(result);
					UTIL.logAsync("The user playlist "+ playlistName + " was retrieved successfully!");
					return res.status(CONSTANTS.OK).json(playlistJson);
				})
				.catch(function(err){
					let errorMessage = "Json file for " + playlistName + " could not be retrieved.";
					throw new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
				});
	}catch(err){
		UTIL.logAsync(err.message);
		res.status(err.code).json({message: err.message});
	}
}
 let addSongToPlaylist = async function(req, res, isFromClient = false){
	let playlistName =  req.query.playlist;
	let songId = req.query.songid;
	let username = req.query.username.toLowerCase();
	let playlistDir = userPlaylistDir(username, playlistName);
	let songInfoDir = songIdInfoDir(songId);
	if (isFromClient) {
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
			// Save the request log
			await UTIL.addRequestLog(uniqueId, req, CONSTANTS.ADD_SONG_TO_PLAYLIST_REQUEST);
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
 		//Getting fields to push to the user for displaying the list of songs.
		let songInfo = {
			'songid': songId,
			'song': songInfoJson['title'],
			'artist': songInfoJson['artist'],
			'album': songInfoJson['album'],
			'liked': false,
		}

		// Checking if the song is already in the playlist, checking by songid.
		for(var i = 0; i < playlistJson['songs'].length; i++){
			UTIL.logAsync(playlistJson['songs'][i].songid);
			UTIL.logAsync(songInfo.songid);
			// Checking if the song is in the playlist already.
			if(playlistJson['songs'][i].songid == songInfo.songid){
				let errorMessage = "The song info for song with song id " + songId + " is already in the playlist.";
				throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
			}
		}

		//Updating the user.json with playlists.
		playlistJson['songs'].push(songInfo);
 		//Updating the song count for playlist JSON.
		playlistJson['song_count'] += 1;
 		// Updating the playlist to include the new song, writing to json.
		await FS.writeFile(playlistDir, JSON.stringify(playlistJson),(err) => {
			if (err){
				let errorMessage = "Json file for " + playlistName + " could not be saved.";
				throw new UTIL.RequestError(CONSTANTS.BAD_REQUEST, errorMessage);
			}
			UTIL.logAsync("Playlist file save request for " + playlistName + " was a success!");
			if (isFromClient){
				//Remove the saved request log
				UTIL.removeRequestLog(uniqueId);
				return res.status(CONSTANTS.OK).json(playlistJson);
			} else {
				UTIL.logAsync("Successfully finsihed logged request for " + username + " in addToPlaylist");
			}
		});
	}catch(err){
		UTIL.logAsync(err.message);
		if (isFromClient){
			// Remove the saved request log
			UTIL.removeRequestLog(uniqueId);
			res.status(err.code).json({message: err.message});
		}
	}
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
	getPlaylistList,
	getPlaylist,
	deletePlaylist,
	userPlaylistDir,
	addSongToPlaylist,
	deleteSongFromPlaylist,
	getSong,
	getArtist,
};
