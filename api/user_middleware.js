'use strict'
// Modules
const util = require('./helper/utilities');
const bcrypt = require('bcrypt');
const CONSTANTS = require('./helper/constants');

// Check whether a username is available
let checkUsernameAvailability = async function(req, res){
  util.authenticateApp(req).then(function(result){
    // Retrieve the username from the request
    if (!util.isEmpty(req.query)){
      let username = req.query.username;
      // Check whether the file for the specified username exists
      if (util.userExists(username)){
	return res.status(CONSTANTS.OK).json({
          "message": "Username cannot be used",
	  "code" : CONSTANTS.USER_FOUND_CODE
        });
      } else {
        return res.status(CONSTANTS.OK).json({
          "message": "Username available to be used",
          "code" : CONSTANTS.USER_NOT_FOUND_CODE
        });
      }
    } else{
      throw new util.RequestError(CONSTANTS.BAD_REQUEST, "Username not given by client");
    }
  }).catch(function(error){
    util.logAsync("Check Username Availibility Error.\nError Message:"+error.message);
    return res.status(error.code).json({"message" : error.message});
  });
}

// Creates the user account
let createUser = function(req, res){
  // Instatiates an authentication promise
  util.authenticateApp(req).then(function(result){
    util.logAsync("Creating User");
    // Make sure that all of the required fields are
    // in the body
    if (req.body.username && req.body.password &&
      req.body.securityQuestion1 && req.body.securityQuestion2 &&
      req.body.securityAnswer1 && req.body.securityAnswer2){
      util.logAsync("Checking request body validity");
      // Check whether the username already exists
      let userDirectoryExists = util.userExists(req.body.username);
      if (!userDirectoryExists){
        util.logAsync("Username is unique, creating account");
        return null;
      } else {
        util.logAsync("Create account username is not unique");
        // The username already exists
        throw new util.RequestError(CONSTANTS.NOT_ACCEPTABLE, "Username cannot be used");
      }
    } else {
      util.logAsync("Create account body does not contain required information");
      throw new util.RequestError(CONSTANTS.BAD_REQUEST, "Body does not contain required information");
    }
  }).then(async function(result){
    util.logAsync("Exctracting user information from request for account creation");
    // The request has passed through all of the tests, create the user account
    let username = req.body.username;
    let passwordHash = await bcrypt.hash(req.body.password, 10);
    let secAnswer1Hash = await bcrypt.hash(req.body.securityAnswer1);
    let secAnswer2Hash = await bcypt.hash(req.body.securityAnswer2);
    // Create the JSON object to save the user's information
    let userData = {
      "username" : username,
      "password" : hash,
      "securityQuestion1" : req.body.securityQuestion1,
      "securityAnswer1" : secAnswer1Hash,
      "securityQuestion2" : req.body.securityQuestion2,
      "securityAnswer2" : secAnswer2Hash,
      "passwordResetToken" : null,
      "playlist_titles": []
    };
    // Save the user data
    util.saveUserDataFile(username, userData);
    util.logAsync("User account created successfully");
    // Send a response of a successful user creation
    return res.status(CONSTANTS.CREATED).json({"message":"User account created successfuly"});
  }).catch(function(error){
    util.logAsync("Error in createUser function.\nError Message:" + error.message);
    return res.status(error.code).json({message: error.message});
  });
}

/*
// Updates the user passwords
let updateUser = function(req, res){
  // Instantiates an authentication promise
  util.authenticateApp(req).then(async function(result){
    // Retrieve the username and password from the body
    let username = req.body.username;
    let resetToken = req.body.resetToken;

    if (username && password){
      // Open the user file based on their username and check if the reset token matches
     // the one that is currently stored
     let userJson = await util.getUserDataFile(username);
     // Retrieve the stored reset token and its expiration period
    } else {
      throw new util.RequestError(CONSTANTS.BAD_REQUEST, "Username or password from client is empty.");
    }
  }).then(function(result){
  }).catch(function(error){
    util.logAsync("Error in updateUser function.\nError Message:" + error.message);
    // The client has given an invalid request or we got an error from the server
    return res.status(error.code).json({"message" : error.message});
  });
}
*/

// Logs in the user
let getUser = async function(req, res){
  // Instantiates an authentication promise
  util.authenticateApp(req).then(async function(result){
    util.logAsync("Verifying user information");
    // Retrieve the username and password from the header
    let username = req.get("username");
    let password = req.get("password");

    // Retrieve the user json file corresponding to the username
    if(username && password){
      let userJson = await util.getUserDataFile(username);
      util.logAsync("Verifying user information");
      // Get the stored password
      let hashPassword = userJson.password;
      // Check whether the passwords match
      let matches = await bcrypt.compare(password, hashPassword);
      if (matches){
        util.logAsync("Password match");
        // The password match, return a successful match
        return res.status(CONSTANTS.ACCEPTED).json({message : "Passwords match"});
      } else {
        util.logAsync("Passwords do not match");
        throw new util.RequestError(CONSTANTS.UNAUTHORIZED, "Invalid password and username combination.");
      }
    } else{
      util.logAsync("Username or password has not been given by client");
      throw new util.RequestError(CONSTANTS.BAD_REQUEST, "Username or Password has not been given by client");
    }
  }).catch(function(error){
    util.logAsync("Error in getUser.\nError Message:" + error.message);
    // The user has given an invalid request
    return res.status(error.code).json({message : error.message});
  });
}

// Export functions and variables
module.exports = {
  createUser,
  //updateUser,
  getUser,
  checkUsernameAvailability
};
