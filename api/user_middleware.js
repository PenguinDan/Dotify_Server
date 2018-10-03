// Modules
const util = require('./utilities');
const bcrypt = require('bcrypt');

// Creates the user account
let createUser = function(req, res){
  // Instatiates an authentication promise
  util.authenticateApp(req, res).then(function(result){
    util.logAsync("Creating User");
    // Make sure that all of the required filends are
    // in the body
    if (req.body.username && req.body.password &&
      req.body.securityQuestion1 && req.body.securityQuestion2 &&
      req.body.securityAnswer1 && req.body.securityAnswer2){
      // Get the user count
      userCount = util.getUserCount();
      // Increment the user count value
      util.incrementUserCount();
      // Concatenate the user count to the username
      username = req.body.username + `#${userCount}`;
      // Hash the password
      hash = bcrypt.hashSync('myPassword', 10);
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
      // Send a response of a successful user creation
      return res.status(200).json({
	"username": username,
	"message" : "User account created successfuly"
      });
    } else {
      res = res.status(400).json({message: "Body does not contain required information"});
      reject(res);
    }
  }).catch(function(result){
    util.logAsync("Invalid Request Received");
    // The user has given an invalid value for the AppKey
    return result;
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
    
  }).then(function(result){
  }).catch(function(result){
  });
}
module.exports = {
  createUser,
  updateUser,
  getUser
};
