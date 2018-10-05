// Modules
const util = require('./utilities');
const bcrypt = require('bcrypt');
const CONSTANTS = require('./constants');

// Check whether a username is available
let checkUsernameAvailability = function(req, res){
  util.authenticateApp(req).then(function(result){
    // Retrieve the username from the request
    let username = req.get('username');
    if (username){
    } else{
      throw new util.RequestError(CONSTANTS.
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
      userDirectoryExists = util.userExists(req.body.username);
      if (!userDirectoryExists){
        util.logAsync("Username is unique, creating account");
        return null;
      } else {
        util.logAsync("Create account username is not unique");
        // The username already exists
        res = res.status(400).json({message: "Username must be unique"});
        reject(res);
      }
    } else {
      util.logAsync("Create account body does not contain required information");
      res = res.status(400).json({message: "Body does not contain required information"});
    }
  }).then(function(result){
    util.logAsync("Exctracting user information from request for account creation");
    // The request has passed through all of the tests, create the user account
    username = req.body.username;
    hash = bcrypt.hashSync(req.body.password, 10);
    // Create the JSON object to save the user's information
    userData = {
      "username" : username,
      "password" : hash,
      "securityQuestion1" : req.body.securityQuestion1,
      "securityAnswer1" : req.body.securityAnswer1,
      "securityQuestion2" : req.body.securityQuestion2,
      "securityAnswer2" : req.body.securityAnswer2,
      "playlist_titles": []
    };
    // Save the user data
    util.saveUserDataFile(username, userData);
    util.logAsync("User account created successfully");
    // Send a response of a successful user creation
    return res.status(200).json({"message":"User account created successfuly"});
  }).catch(function(error){
    util.logAsync("Invalid Request Received Create Account Request");
    // The user has given an invalid value for the AppKey
    return error;
  });
}


let updateUser = function(req, res){
  // Instantiates an authentication promise
  util.authenticateApp(req, res).then(function(result){
  }).then(function(result){
  }).catch(function(result){
  });
}

// Logs in the user
let getUser = async function(req, res){
  // Instantiates an authentication promise
  util.authenticateApp(req, res).then(async function(result){
    util.logAsync("Verifying user information");
    // Retrieve the username and password from the header
    username = req.get("username");
    password = req.get("password");

    // Retrieve the user json file corresponding to the username
    if(username && password){
      try{
        userJson = await util.getUserDataFile(username);
        util.logAsync("Verifying user information");
        // Get the stored password
        hashPassword = userJson.password;
        // Check whether the passwords match
        matches = await bcrypt.compare(password, hashPassword);
        if (matches){
	  util.logAsync("Password match");
          // The password match, return a successful match
	  return res.status(200).json({message : "Passwords match"});
        } else {
	  util.logAsync("Passwords do not match");
          throw new Error("Passwords do not match!");
        }
      }catch(error){
	util.logAsync("Error retrieving user file");
	throw error;
      }
    } else{
      util.logAsync("Username or password has not been given by client");
      throw new Error("Username or Password has not been given by client");
    }
  }).catch(function(error){
    // The user has given an invalid request
    return res.status(400).json({message : error.message});
  });
}

// Export functions and variables
module.exports = {
  createUser,
  updateUser,
  getUser,
  checkUsernameAvailability
};
