// Modules
const FS = require('fs');
const WINSTON = require('winston');

// Configuration
const CONFIG = JSON.parse(FS.readFileSync('./api/config/config.json'));
const SERVER_DATA = JSON.parse(FS.readFileSync('./api/config/server_data.json'));
const APPKEY = CONFIG.AppKey;

// Constants
const EMPTY_APPKEY_ERROR = 0;
const INVALID_APPKEY_ERROR = 1;

// Lets the application know that no Application Keys were provided
// or if the application key was invalid
function invalidAppKey(appKeyError, res){
  if(appKeyError == EMPTY_APPKEY_ERROR){
    return res.status(401).json({message: "AppKey was not provided."});
  }else{
    return res.status(406).json({message: "Invalid AppKey has been provided."});
  }
}

// Checks whether the application contains the correct credentials
function authenticateApp(req, res){
  return new Promise(function(resolve, reject){
    // Retrieves the Application Key
    let appKey = req.get('AppKey');
    // Checks whether we have an application key
    if(appKey){
      if(appKey != APPKEY){
	res = invalidAppKey(INVALID_APPKEY_ERROR, res);
        // The appkey given by the appication is invalid
	reject(res);
      }
      // The appkey given by the application is correct
      resolve(res);
    } else {
	res = invalidAppKey(EMPTY_APPKEY_ERROR, res);
	// The appkey was not given by the application
	reject(res);
    }
  });
}

// Checks how many users are currently in the system
function getUserCount(){
  return SERVER_DATA.UserCount;
}

// Asynchronously logs
function logAsync(message){
  WINSTON.info(message, {timestamp: Data.now()});
}

module.exports = {
  authenticateApp,
  getUserCount,
  logAsync
}
