//Importing modules
const FS = require('fs');
const UTIL = require('./utilities');
const USER_PATH = "./api/models/users/";
const SONG_PATH = "./api/models/songs/";

//Create playlist for the user.
let createPlaylist = function(req, res){
	UTIL.authenticateApp(req, res).then( function(results){
                UTIL.logAsync("Creating playlist");
                //Getting the path for the user storage.
                let userId = req.headers.userid;

                const userIdPath = USER_PATH + userId + "/" + userId + ".json";

                //Retrieve the JSON data for playlist of the requesting user.
                let userFile = JSON.parse(FS.readFileSync(userIdPath));
                return res.json(userFile.playlist);
        }).catch(function(result){
                UTIL.logAsycn("The playlist list could not be retrieved for the user.");
                return result;
        });

}

//get a list of playlist from user.
let getPlaylist = function(req, res){
	//Get the id of the user from req.
	UTIL.authenticateApp(req, res).then( function(results){
		UTIL.logAsync("Getting playlist");
		//Getting the path for the user storage.
		let userId = req.headers.userid;

		const userIdPath = USER_PATH + userId + "/" + userId + ".json";

		//Retrieve the JSON data for playlist of the requesting user.
		let userFile = JSON.parse(FS.readFileSync(userIdPath));
		return res.json(userFile.playlist);
	}).catch(function(result){
		UTIL.logAsycn("The playlist list could not be retrieved for the user.");
		return result;
	});
}



module.exports = {
	getPlaylist
};
