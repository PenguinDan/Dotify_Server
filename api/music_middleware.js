'use strict'
//Importing modules
const FS = require('fs');
const UTIL = require('./helper/utilities');
const CONSTANTS = require('./helper/constants');

//Create playlist for the user.
let createPlaylist = function(req, res){

}

//get a list of playlist from user.
let getPlaylist = async function(req, res){
	//Get the id of the user from req.
	let result = await UTIL.authenticateApp(req)
		.then(function(result){})//Then if the user is authenticated.
		.catch(function(error){//User could not authenticate.
		return res.status(error.errorCode).json({message: error.errorMessage});
		});	

	let userJson = await UTIL.getUserDataFile(req.query.username)
		.then(function(result){})
		.catch(function(error){
		//The JSON file for the user did not exist.
		UTIL.logAsync("Error");
		return res.status(201).json({message:"This is the message"});
		});

}



module.exports = {
	getPlaylist
};
