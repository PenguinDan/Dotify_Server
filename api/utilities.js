'use strict'
// Modules
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const CONSTANTS = require('./constants');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

// Initialize Modules
// Initialize Winston Module
const logger = createLogger({
  level: 'info',
  format: combine(
    label({ label: 'Runtime Debug'}),
    timestamp(),
    prettyPrint()
  ),
  transports: [new transports.Console()]
});

// Configuration
const CONFIG = JSON.parse(FS.readFileSync(CONSTANTS.CONFIG_FILEPATH));
const SERVER_DATA = JSON.parse(FS.readFileSync(CONSTANTS.SERVER_DATA_FILEPATH));
const APPKEY = CONFIG.AppKey;

// Custom Classes
// Class for defining authentication errors
class RequestError extends Error{
  // Constructor object for the AuthError object
  // @Param:
  //   errorCode: The error code associated with this error
  //  ...params: All of the rest of the parameters for a normal Error object such
  //             as the error message itself
  constructor(errorCode, ...params){
    // Pass remaining arguments to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace){
      Error.captureStackTrace(this, AuthError);
    }

   this.code = errorCode;
  }
}

// Checks whether the application contains the correct credentials
function authenticateApp(req){
  return new Promise(function(resolve, reject){
  // Retrieves the Application Key
    let appKey = req.get('AppKey');
    // Checks whether we have an application key
    if(appKey){
      if(appKey != APPKEY){
        let error = new RequestError(CONSTANTS.UNAUTHORIZED, "Invalid AppKey provided by client");
        logAsync(error.code);
        // The client has passed an invalid AppKey to the server
        throw new RequestError(CONSTANTS.UNAUTHORIZED, "Invalid AppKey provided by client");
      }
      // The appkey given by the application is correct
      resolve(null);
    } else {
      // The client has not given us an AppKey
      throw new RequestError(CONSTANTS.UNAUTHORIZED, "AppKey was not provided");
    }
  });
}

// Checks whether a user exists with the specified username
function userExists(username){
  // The directory associated with a username
  let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}/${username}`;
  // Look for the user file
  if(!FS.existsSync(userDirectory)){
    return false;
  }
  return true;
}

// Saves the user data
function saveUserDataFile(username, jsonFile){
  let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}/${username}`;
  let userDataFilePath = `${userDirectory}/user.json`;

  if (!FS.existsSync(userDirectory)){
    FS.mkdirSync(userDirectory);
  }
  // Saves the user json file into the directory
  // corresponding with the user's username
  FS.writeFileSync(userDataFilePath, JSON.stringify(jsonFile));
}

// Gets the user.json for user with given username parameter.
async function getUserDataFile(username){
 //Setting directory paths.
 let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${username}`;
 let userDataFilePath = `${userDirectory}/user.json`;
  //Retrieving JSON file for the user.
  try{
    let userFile = await FS.readFileAsync(userDataFilePath);
    return JSON.parse(userFile);
  }catch(error){
    errorMessage = `Json file ${userDataFilePath} for ${username} cannot be found`;
    logAsync(error.message);
    throw new Error(errorMessage);
  }
}

// Asynchronously logs
function logAsync(message){
  logger.info(message);
}

module.exports = {
  authenticateApp,
  userExists,
  logAsync,
  saveUserDataFile,
  getUserDataFile,
  RequestError
}
