'use strict'
// Modules
const util = require('./helper/utilities');
const bcrypt = require('bcrypt');
const CONSTANTS = require('./helper/constants');
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const { ResetToken } = require('./helper/security');
const UUID = require('uuid/v4');

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
let createUser = function(req, res, isFromClient = false){
  if (isFromClient){
    var uniqueId = UUID();
  }
  // Instatiates an authentication promise
  util.authenticateApp(req).then(async function(result){
    util.logAsync("Creating User");
    // Make sure that all of the required fields are
    // in the body
    if (req.body.username && req.body.password &&
      req.body.securityQuestion1 && req.body.securityQuestion2 &&
      req.body.securityAnswer1 && req.body.securityAnswer2){
      util.logAsync("Log the Request for Create User");
      if (isFromClient){
        // Create a unique Id for the request
        await util.addRequestLog(uniqueId, req, CONSTANTS.CREATE_ACCOUNT_REQUEST);
      }
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
    let secAnswer1Hash = await bcrypt.hash(req.body.securityAnswer1.toLowerCase(), 10);
    let secAnswer2Hash = await bcrypt.hash(req.body.securityAnswer2.toLowerCase(), 10);
    // Create the JSON object to save the user's information
    let userData = {
      "username" : username,
      "password" : passwordHash,
      "securityQuestion1" : req.body.securityQuestion1,
      "securityAnswer1" : secAnswer1Hash,
      "securityQuestion2" : req.body.securityQuestion2,
      "securityAnswer2" : secAnswer2Hash,
      "resetToken" : null,
      "playlist_titles": [],
      "userQuote" : "",
      "imageBytes" : []
    };
    return userData;
  }).then(async function(userData){
    // Create user directory
    let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${userData.username}`;
    await FS.mkdir(userDirectory, (err) => {
      if (err){
        let errorMessage = "Directory for " + userData.username + " could not be saved.";
        util.logAsync(errorMessage);
        throw new util.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
      }
      util.logAsync("Directory creation for " + userData.username + " was a success!");
    });
    return userData;
  }).then(async function(userData){
    //Create playlist directory for user
    let playlistDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${userData.username}/playlists`;
    util.logAsync(playlistDirectory);
    await FS.mkdir(playlistDirectory, (err) => {
      if (err){
        let errorMessage = "Playlist directory for " + userData.username + " could not be saved.";
        util.logAsync(errorMessage);
        throw new util.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
      }
      util.logAsync("Playlist directory creation for " + userData.username + " was a success!");
    });
    return userData;
  }).then(async function(userData){
    // Create the recommender file for the user
    let recommenderFile = `${CONSTANTS.USER_DATA_DIRECTORY}${userData.username}/recommender.json`;
    // Create the empty recommender JSON object
    let recommenderJson = {
      "likes" : [],
      "dislikes" : []
    };
    await FS.writeFile(recommenderFile, JSON.stringify(recommenderJson), (err) => {
      if(err){
        let errorMessage = "Recommender file for" + userData.username + " could not be created.";
        util.logAsync(errorMessage);
        throw new util.RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
      }
    });
    return userData;
  }).then(function(userData){
    // Save the user data file
    util.saveUserDataFile(userData.username, userData);
    if (isFromClient){
      // Remove the saved request log
      util.removeRequestLog(uniqueId);
      // Send a response of a successful user creation
      return res.status(CONSTANTS.CREATED).json({"message":"User account created successfuly"});
    } else {
      util.logAsync("Successfully finished logged request from " + userData.username + " in createUser");
    }
  }).catch(function(error){
    util.logAsync("Error in createUser function.\nError Message:" + error.message);
    if (isFromClient){
      // Delete the Request log
      util.removeRequestLog(uniqueId);
      return res.status(error.code).json({message: error.message});
    }
  });
}


// Updates the user passwords
let updateUser = function(req, res, isFromClient = false){
  // Initialize a unique identifier for the current request
  // only if the request is coming from a client
  if (!isFromClient) {
    var uniqueId = UUID();
  }
  // Instantiates an authentication promise
  util.authenticateApp(req).then(async function(result){
    // Retrieve the username and password from the body
    let username = req.body.username;
    let clientToken = req.body.token;

    if (username && req.body.password && clientToken){
      if (isFromClient){
        // Log the request
        await util.addRequestLog(uniqueId, req, CONSTANTS.UPDATE_USER_PASSWORD_REQUEST);
      }
      // Open the user file based on their username and check if the reset token matches
      // the one that is currently stored
      let userJson = await util.getUserDataFile(username);
      let resetToken = userJson.resetToken;

      // Build the Error object in case of errors
      let requestError = new util.RequestError(CONSTANTS.FORBIDDEN, "Forbidden client request");

      // Make sure that the user even has a reset token
      if (resetToken === null){
	util.logAsync("User does not have a reset token assigned");
        throw requestError;
      }

      // Make sure that the expiration time hasn't passed
      if (resetToken.expirationTime < Date.now()){
        util.logAsync("Client has passed in an expired token");
        userJson.resetToken = null;
        util.saveUserDataFile(username, userJson);
        throw requestError;
      }

      // Check that the server and client reset tokens match
      if (resetToken.token === clientToken){
	return userJson;
      } else {
	util.logAsync("Client gave incorrect token for specified user");
	throw requestError;
      }
    } else {
      throw new util.RequestError(CONSTANTS.FORBIDDEN, "Username, password, or reset token from client is empty.");
    }
  }).then(async function(userJson){
    // Set the new password for the json object
    let passwordHash = await bcrypt.hash(req.body.password, 10);
    userJson.password = passwordHash;
    util.saveUserDataFile(req.body.username, userJson);
    // Erase the token value for the user now
    userJson.resetToken = null;
    // Save the user json file
    util.saveUserDataFile(userJson.username, userJson);
    if (isFromClient){
      // Remove the Request log for the current client
      util.removeRequestLog(uniqueId);
      return res.status(CONSTANTS.ACCEPTED).json({"message" : "Password has been successfully changed"});
    } else {
      util.logAsync("Successfully finished logged request for " + userJson.username + " in updatePassword");
    }
  }).catch(function(error){
    util.logAsync("Error in updateUser function.\nError Message:" + error.message);
    if (isFromClient){
      util.removeRequestLog(uniqueId);
      // The client has given an invalid request or we got an error from the server
      return res.status(error.code).json({"message" : error.message});
    }
  });
}


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
      util.logAsync("Verifying user information for:" + userJson);
      // Get the stored password
      let hashPassword = userJson.password;
      // Check whether the passwords match
      let matches = await bcrypt.compare(password, hashPassword);
      if (matches){
        util.logAsync("Password match");
        // The password match, return a successful match
        return res.status(CONSTANTS.ACCEPTED).json({
	  username : userJson.username,
	  userQuote: userJson.userQuote,
	  profileImage: userJson.imageBytes
	  });
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

// Retrieves the reset questions for the specified user
let getResetQuestions = function(req, res){
  // Instantiates an authotication promise
  util.authenticateApp(req).then(async function(result){
    // Retrieve the user's username
    let username = req.get("username");
    // Check that the username was given by the user
    if (username){
      // Retrieve the user json file associated with their username
      let userJson = await util.getUserDataFile(username);
      // Send the reset questions
      util.logAsync("Sending reset questions back to client");
      return res.status(CONSTANTS.OK).json({
	"securityQuestion1": userJson.securityQuestion1,
	"securityQuestion2": userJson.securityQuestion2
      });
    } else {
      util.logAsync("Username has not been given by client");
      throw new util.RequestError(CONSTANTS.BAD_REQUEST, "Username has not been given by the client");
    }
  }).catch(function (error){
    util.logAsync("Error in getResetQuestions.\nError Message:" + error.message);
    // The user has given an invalid request
    return res.status(error.code).json({message : error.message});
  });
}

// Check whether the question answers for the reset are correct
let checkQuestionAnswers = function(req, res){
  util.authenticateApp(req).then(async function(result){
    // Check whether the request constains the required information
    let username = req.get("username");
    let securityAnswer1 = req.get("securityAnswer1");
    let securityAnswer2 = req.get("securityAnswer2");

    if (username && securityAnswer1 && securityAnswer2){
      // Retrieve the user json file
      let userJson = await util.getUserDataFile(username);
      // Retrieve the hashes for the security answers
      let secHash1 = userJson.securityAnswer1;
      let secHash2 = userJson.securityAnswer2;
      // Check whether the answers passed by the client are correct
      let secCorrect1 = await bcrypt.compare(securityAnswer1.toLowerCase(), secHash1);
      let secCorrect2 = await bcrypt.compare(securityAnswer2.toLowerCase(), secHash2);
      if (secCorrect1 && secCorrect2) {
	// Generate the security token for the user
	let securityToken = await ResetToken.generateToken(128);
        // Generate the future time that the token is supposed to expire in
        let expirationTime = util.generateFutureDate(30);
	// Create the ResetToken object for the user
	let token = new ResetToken(securityToken, expirationTime);
	util.logAsync("User json file saved successfully from Check Question Answers with token");
        return {json : userJson, resetToken : token};
      } else {
	throw new util.RequestError(CONSTANTS.NOT_ACCEPTABLE, "Security answers not acceptable");
      }
    } else {
      throw new util.RequestError(CONSTANTS.BAD_REQUEST, "Request does not contain required header information");
    }
  }).then(async function(vals){
    // Save the reset token created for the user
    let userJson = vals.json;
    userJson.resetToken = vals.resetToken;
    util.saveUserDataFile(userJson.username, userJson);
    // Delete the user's ip address from the list of addresses waitning to receive their
    // security token
    let secVals = await util.getSecurityAnswerQueue();
    let setObj = secVals.set;
    let setJson = secVals.json;
    setObj.delete(req.ip);
    setJson.set = Array.from(setObj);
    await util.saveSecurityAnswerQueue(setJson);
    // Return a response to the user
    return res.status(CONSTANTS.ACCEPTED).json({
      "message" : "Security questions validated successfully",
      "token" : vals.resetToken.token
    });
  }).catch(function(error){
    util.logAsync("Error in checkQuestionAnswers.\nError Message:" + error.message);
    return res.status(error.code).json({"message" : error.message});
  });
}


let saveUserProfileImage = function(req, res, isFromClient) {
  if (isFromClient){
    var uniqueId = UUID();
  }
}
// Export functions and variables
module.exports = {
  createUser,
  updateUser,
  getUser,
  getResetQuestions,
  checkUsernameAvailability,
  checkQuestionAnswers,
  saveUserProfileImage
};
