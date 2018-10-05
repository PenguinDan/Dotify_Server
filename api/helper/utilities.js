'use strict'
// Modules
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const CONSTANTS = require('./constants');
const CRYPTO = require('crypto');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

// Initialize Modules
// Initialize Winston Module
const printFormat = printf(info => {
  return `${info.timestamp} [${info.label}] \n${info.level}: ${info.message}`;
});
const logger = createLogger({
  level: 'info',
  format: combine(
    label({ label: 'Runtime Debug'}),
    timestamp(),
    printFormat
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
      Error.captureStackTrace(this, RequestError);
    }

   this.code = errorCode;
  }
}

class ResetToken{
  // Constructor for the ResetToken object
  // @Param:
  //  tokenVal: The token value to be stored
  //  expiration: The expiration time
  constructor(tokenVal, expiration){
    this.token = tokenVal;
    this.expirationTime = expiration;
  }

  // Generates a cryptographically strong random key with the specified
  // byte length
  // @Param:
  //    byteLength: The byte length value that the key should contain
  // @Return:
  //    A cryptographically strong random key
  static async generateToken(byteLength){
    let token = await CRYPTO.randomBytes(byteLength);
    return token.toString('base64');
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
        // The client has passed an invalid AppKey to the server
        logAsync("The client has passed an invalid AppKey to the server");
	 throw new RequestError(CONSTANTS.UNAUTHORIZED, "Invalid AppKey provided by client");
      }
      // The appkey given by the application is correct.
      logAsync("The AppKey given by the application is correct");
      resolve(null);
    } else {
      // The client has not given us an AppKey.
      logAsync("The client did not make request with an AppKey");
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
    logAsync("The user JSON file exist");
    return JSON.parse(userFile);
  }catch(error){
    errorMessage = `Json file ${userDataFilePath} for ${username} cannot be found`;
    logAsync("The user json file does not exist");
    throw new RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
  }
}

// Asynchronously logs
function logAsync(message){
  logger.info(message);
}


// Checks if an object is empty
function isEmpty(obj){
  for(let key in obj){
    if(obj.hasOwnProperty(key)){
      return false;
    }
  }
  return true;
}

module.exports = {
  authenticateApp,
  userExists,
  logAsync,
  saveUserDataFile,
  getUserDataFile,
  isEmpty,
  RequestError
}
