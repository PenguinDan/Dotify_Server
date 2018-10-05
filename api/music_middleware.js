//Importing modules
const FS = require('fs');
const UTIL = require('./utilities');
const CONSTANTS = require('./constants');

//Create playlist for the user.
let createPlaylist = function(req, res){
	UTIL.authenticateApp(req, res).then( function(results){
                UTIL.logAsync("Creating playlist");
                //Getting the path for the user storage.
                let userId = req.headers.userid;

                const userIdPath = CONSTANTS.USER_PATH + userId + "/" + userId + ".json";

                //Retrieve the JSON data for playlist of the requesting user.
                let userFile = JSON.parse(FS.readFileSync(userIdPath));
                return res.json(userFile.playlist);
        }).catch(function(result){
                UTIL.logAsync("The playlist list could not be retrieved for the user.");
                return result;
        });
//Get the id of the user from req.
        UTIL.authenticateApp(req, res).then( async function(results){
                UTIL.logAsync("Getting playlist");
                //Getting the path for the user storage.
                let userId = req.headers.userid;

                const userIdPath = CONSTANTS.USER_PATH + userId + "user.json";
                try{
                //Retrieve the JSON data for playlist of the requesting user.
                        return res.status(200).json({"message": "Playlist success?"});
                }
                catch(error){
                        UTIL.logAsync("Error reading user.json file");
                        return res.status(204).json({"message" : "Error reading user file"});
                }
        }).catch(function(result){
                UTIL.logAsync("The playlist list could not be retrieved for the user.");
        });

}

//get a list of playlist from user.
let getPlaylist = async function(req, res){
	//Get the id of the user from req.
	let result = await UTIL.authenticateApp(req, res)
		.then(function(result){})//Then if the user is authenticated.
		.catch(function(error){
		//Returns with no playlist if the user could not be authenticated.
		UTIL.logAsync("The app could not be authenticated.");
		return res.status(901).json({message:"The app was not authenticated."});
		});	
	//UTIL.logAsync(req.get("userid"));
	let userJson = await UTIL.getUserDataFile(req.get("userid"), res)
		.then(function(result){})
		.catch(function(error){
		//The JSON file for the user did not exist.
		return res.status(204).json({message:"The user does not have any profile information."});
		});

}



module.exports = {
	getPlaylist
};
