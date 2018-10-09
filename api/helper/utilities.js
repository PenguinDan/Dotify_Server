'use strict'
// Modules
const BLUEBIRD = require('bluebird');
const FS = BLUEBIRD.promisifyAll(require('fs'));
const CONSTANTS = require('./constants');
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
async function saveUserDataFile(username, jsonFile){
  let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${username}`;
  let userDataFilePath = `${userDirectory}/user.json`;
  // Saves the user json file into the directory
  // corresponding with the user's username
  await FS.writeFile(userDataFilePath, JSON.stringify(jsonFile),(err) => {
    if (err){
      let errorMessage = "Json file for " + username + " could not be saved.";
      logAsync(errorMessage);
      throw new RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
    }
    logAsync("User file save request for " + username + " was a success!");
    return true;
  });
}

// Gets the user.json for user with given username parameter.
async function getUserDataFile(username){
  //Setting directory paths.
  let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${username}`;
  let userDataFilePath = `${userDirectory}/user.json`;
  //Retrieving JSON file for the user.
  try{
    let userFile = await FS.readFileAsync(userDataFilePath);
    userFile = JSON.parse(userFile);
    logAsync("The user JSON file exist");
    return userFile;
  }catch(error){
    let errorMessage = `Json file for ${username} cannot be found`;
    logAsync(errorMessage);
    throw new RequestError(CONSTANTS.INTERNAL_SERVER_ERROR, errorMessage);
  }
}

// Gets the recommender.json for user with given username parameter
async function getUserRecommenderFile(username){
  // Setting directory paths
  let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${username}`;
  let userRecommenderFilePath = `${userDirectory}/recommender.json`;
  try {
    let recommenderFile = await FS.readFileAsync(userRecommenderFilePath);
    recommenderFile = JSON.parse(recommenderFile);
    logAsync("The recommender JSON file.");
    return recommenderFile;
  } catch(error){
    let errorMessage = `Recommender file for ${username} could not be found`;
    logAsync(errorMessage);
    throw new RequestError(CONSTANT.INTERNAL_SERVER_ERROR, errorMessage);
  }
}

// Saves the user recommender json file
async function saveUserRecommenderFile(username, jsonObj){
  // Setting directory paths
  let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}${username}`;
  let userRecommenderFilePath = `${userDirectory}/recommender.json`;
  // Saves the user recommender json file in to its directory
  // corresponding with the user's username
  await FS.writeFile(userRecommenderFilePath, JSON.stringify(jsonObj));
  return true;
}

// Retrieves the Json file for the queue of ip addresses that are still
// waiting to receive their responses
async function getSecurityAnswerQueue(){
  logAsync("Retrieving and returning security answer queue object");
  let secQueue = await FS.readFileAsync(CONSTANTS.SECURITY_ANSWER_QUEUE_FILEPATH);
  // Parse the object received into their set items
  secQueue = JSON.parse(secQueue);
  // Retrieve the array object from the security queue and return a set object
  // from it
  return {set : new Set(secQueue.set), json : secQueue};
}

// Serializes a set object into its JSON equivalent
async function saveSecurityAnswerQueue(secQueueJson){
  logAsync("Saving security answer queue json object");
  await FS.writeFile(CONSTANTS.SECURITY_ANSWER_QUEUE_FILEPATH, JSON.stringify(secQueueJson));
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

// Generates a date value depending on how far in minutes
// in the future you want to generate
function generateFutureDate(minutes){
  // The minutes in milliseconds
  let mil = minutes * 60000;
  // Future time in milliseconds
  return Date.now() + mil;
}

module.exports = {
  authenticateApp,
  userExists,
  logAsync,
  saveUserDataFile,
  getUserDataFile,
  isEmpty,
  RequestError,
  generateFutureDate,
  getUserRecommenderFile,
  saveUserRecommenderFile,
  getSecurityAnswerQueue,
  saveSecurityAnswerQueue
}
