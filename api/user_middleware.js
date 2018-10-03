// Modules
const util = require('./utilities');
const bcrypt = require('bcrypt');


// Check whether a username is available
let checkUsernameAvailability = function(req, res){
  // Instantiates an authentication promise
  util.authenticateApp(req, res).then(function(result){
    username = req.get('username');
    if (username){
      userDirectoryExists = util.userExists(username);
      if (!userDirectoryExists){
        return res.status(200).json({
	  message: "Username does not exists",
          code: 901
	});
      }
    } else{
      util.logAsync("Username not provided for username availability check");
      reject(res.status(400).json({message: "Username must be provided for availibility check"}));
    }
  }).catch(function(error){
    util.logAsync("Error in check username availability");
    return error;
  });
}
// Creates the user account
let createUser = function(req, res){
  // Instatiates an authentication promise
  util.authenticateApp(req, res).then(function(result){
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
      reject(res);
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
let getUser = function(req, res){
  // Instantiates an authentication promise
  util.authenticateApp(req, res).then(function(result){
    util.logAsync("Verifying user information");
    // Retrieve the user json file corresponding to the username
    if(req.body.username && req.body.password){

    } else{
      res = res.status(400).json({message: "Username or Password is required for the login operation"});
      reject(res);
    }
  }).then(function(result){
  }).catch(function(result){
    util.logAsync("Invalid Request Received for Login");
    // The user has given an invalid request
    return result;
  });
}
module.exports = {
  createUser,
  updateUser,
  getUser
};
