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
	let result = await UTIL.authenticateApp(req, res).then().catch(function(error){
		UTIL.logAsync("The app could not be authenticated.");
	});	

}



module.exports = {
	getPlaylist
};
