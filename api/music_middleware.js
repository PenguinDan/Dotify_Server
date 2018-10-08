'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');
var dateTime = require('node-datetime');


function userPlaylistDir(username, playlist){
	return `${CONSTANTS.USER_DATA_DIRECTORY}${username}/playlists/${playlist}.json`;
}
function songIdInfoDir(songId){
	return `${CONSTANTS.SONG_INFO_DIRECTORY}/${songId}.json`
}

//Delete playlist for the user.
let deletePlaylist = async function(req, res){
	let playlistName = req.query.playlist;
	//Get the id of the user from req.
	await UTIL.authenticateApp(req)
		.then(function(result){})
		.catch(function(error){
			return res.status(error.code).json({message: error.message});
		});
	//Retrieving the userJson for the requesting user.
	let userJson = await UTIL.getUserDataFile(req.query.username)
		.then(function(result){
			return result;
		})
		.catch(function(error){
			//The JSON file for the user did not exist.
			res.status(error.code).json({message: error.message});
		});
	if(!userJson){
		return;
	}
		//Checking if the playlist request name is null.
	if(!playlistName){
		UTIL.logAsync("The delete playlist param was not given a valid playlist name.");
		return res.status(CONSTANTS.BAD_REQUEST).json({message: "The delete playlist was not given a valid playlist name."});
	}

	if(!userJson['playlist_titles'].includes(playlistName)){
		UTIL.logAsync("The playlist for the user does not exist");
		return res.status(CONSTANTS.BAD_REQUEST).json({message: "The playlist for the user does not exist."});
	}

	//Deleting the playlist from the user json.
	for(var i = 0; i < userJson['playlist_titles'].length; i++){
		if(userJson['playlist_titles'][i] == playlistName){
			userJson['playlist_titles'].splice(i,1);
		}
	}

	let playlistDir = userPlaylistDir(req.query.username, playlistName)

	await FS.unlink(playlistDir, (err) => {
		if (err){
			let errorMessage = "Json file for " + playlistName + " could not be deleted.";
			UTIL.logAsync(errorMessage);
			return res.status(CONSTANTS.BAD_REQUEST).json({message: errorMessage});
		}
		UTIL.logAsync("Playlist file delete request for " + playlistName+ " was a success!");
		return true;
	});

	//Saving the user.json with the new playlist saved.
	await UTIL.saveUserDataFile(req.query.username, userJson)
		.then(function(result){
			//returning user's json file with an 200 status.
			return res.status(CONSTANTS.OK).json(userJson);
		})
		.catch(function(error){
			//The JSON file for the user did not exist.
			return res.status(error.code).json({message: error.message});
		});

}

//Create playlist for the user.
let createPlaylist = async function(req, res){

	let playlistName = req.query.playlist;

	//Get the id of the user from req.
	await UTIL.authenticateApp(req)
		.then(function(result){})
		.catch(function(error){
			return res.status(error.code).json({message: error.message});
		});
	//Retrieving the userJson for the requesting user.
	let userJson = await UTIL.getUserDataFile(req.query.username)
		.then(function(result){
		return result;
		})
		.catch(function(error){
			//The JSON file for the user did not exist.
			return res.status(error.code).json({message: error.message});
		});

	if(!userJson){
		return;
	}
	
	//Checking if the playlist request name is null.
	if(!playlistName){
		UTIL.logAsync("The create playlist was not given a valid playlist name.");
		return res.status(CONSTANTS.BAD_REQUEST).json({message: "The new playlist name was not specified with request."});
	}

	if(userJson['playlist_titles'].includes(playlistName)){
		UTIL.logAsync("The playlist for the user already exists.");
		return res.status(CONSTANTS.BAD_REQUEST).json({message: "The playlist for the user already exist."});
	}

	let playlistDir = userPlaylistDir(req.query.username, playlistName)
	
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
			UTIL.logAsync(errorMessage);
			return res.status(CONSTANTS.BAD_REQUEST).json({message: errorMessage});
		}
		UTIL.logAsync("Playlist file save request for " + playlistName+ " was a success!");
		return true;
		});

	//Updating the user.json with playlists.
	userJson['playlist_titles'].push(playlistName);

	//Saving the user.json with the new playlist saved.
	await UTIL.saveUserDataFile(req.query.username, userJson)
		.then(function(result){
			//returning user's json file with an 200 status.
			return res.status(CONSTANTS.OK).json(userJson);
		})
		.catch(function(error){
			//The JSON file for the user did not exist.
			return res.status(error.code).json({message: error.message});
		});

}

//get a list of playlist from user.
let getPlaylistList = async function(req, res){
	//Get the id of the user from req.
	await UTIL.authenticateApp(req)
		.then(function(result){})
		.catch(function(error){
			return res.status(error.code).json({message: error.message});
		});
	//Retrieving the userJson for the requesting user.
	let userJson = await UTIL.getUserDataFile(req.query.username)
		.then(function(result){
		return result;
	})
	.catch(function(error){
		//The JSON file for the user did not exist.
		res.status(error.code).json({message: error.message});
	});
	if(!userJson){
		return;
	}
	//returning user's playlist_list with an 200 status.
	return res.status(CONSTANTS.OK).json({playlist_titles: userJson.playlist_titles});
}



//get acplaylist for user.
let getPlaylist = async function(req, res){

	let playlistName =  req.query.playlist;
	let playlistDir = userPlaylistDir(req.query.username, playlistName)
	//Checking if the playlist name is null.
	if(!playlistName){
		UTIL.logAsync("Playlist name requested was invalid.")
		return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Playlist name requested was invalid"});
	}
	//Authenticating the application from req.
	await UTIL.authenticateApp(req)
		.then(function(result){})
		.catch(function(error){
			return res.status(error.code).json({message: error.message});
		});
	
	await FS.readFileAsync(playlistDir)
			.then(function(result){
				let playlistJson = JSON.parse(result);
				UTIL.logAsync("The user playlist "+ playlistName + " was retrieved successfully!");
				return res.status(CONSTANTS.OK).json(playlistJson);
			})
			.catch(function(err){
				let errorMessage = "Json file for " + playlistName + " could not be retrieved.";
				let error = new UTIL.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
				UTIL.logAsync(errorMessage);
				return res.status(error.code).json({message: errorMessage});
			});
}

let addSongToPlaylist = async function(req, res){
	let playlistName =  req.query.playlist;
	let songId = req.query.songid;
	let playlistDir = userPlaylistDir(req.query.username, playlistName)
	let songInfoDir = songIdInfoDir(songId);
	UTIL.logAsync(songInfoDir);
	try{
	//Checking if the playlist name is null.
	if(!playlistName){
		UTIL.logAsync("Playlist name requested was invalid.")
		return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Playlist name requested was invalid"});
	}
	//Checking if the song id is null;
	if(!songId){
		UTIL.logAsync("Song ID name requested was invalid.")
		return res.status(CONSTANTS.INTERNAL_SERVER_ERROR).json({message: "Song ID name requested was invalid"});
	}

	//Authenticating application.
	await UTIL.authenticateApp(req)
		.then(function(result){})
		.catch(function(error){
			return res.status(error.code).json({message: error.message});
		});

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
	}
	
	//Updating the user.json with playlists.
	playlistJson['songs'].push(songInfo); 

	// Updating the playlist to include the new song, writing to json.
	await FS.writeFile(playlistDir, JSON.stringify(playlistJson),(err) => {
		if (err){
			let errorMessage = "Json file for " + playlistName + " could not be saved.";
			UTIL.logAsync(errorMessage);
			return res.status(CONSTANTS.BAD_REQUEST).json({message: errorMessage});
		}
		UTIL.logAsync("Playlist file save request for " + playlistName + " was a success!");
		return res.status(CONSTANTS.OK).json(playlistJson);
		});
	}catch(err){
		UTIL.logAsync(err.message);
		res.status(err.code).json({message: err.message});
	}
}




module.exports = {
	createPlaylist,
	getPlaylistList,
	getPlaylist,
	deletePlaylist,
	userPlaylistDir,
	addSongToPlaylist,
};
