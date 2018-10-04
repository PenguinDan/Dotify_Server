// Modules
const FS = require('fs');
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

// Constant
const EMPTY_APPKEY_ERROR = 0;
const INVALID_APPKEY_ERROR = 1;
const INVALID_BODY_ERROR = 2;

// Configuration
const CONFIG = JSON.parse(FS.readFileSync(CONSTANTS.CONFIG_FILEPATH));
const SERVER_DATA = JSON.parse(FS.readFileSync(CONSTANTS.SERVER_DATA_FILEPATH));
const APPKEY = CONFIG.AppKey;

// Checks whether the application contains the correct credentials
function authenticateApp(req, res){
  return new Promise(function(resolve, reject){
    // Retrieves the Application Key
    let appKey = req.get('AppKey');
    // Checks whether we have an application key
    if(appKey){
      if(appKey != APPKEY){
	res = res.status(406).json({message: "Invalid AppKey has been provided."});
        // The appkey given by the appication is invalid
	reject(res);
      }
      // The appkey given by the application is correct
      resolve(res);
    } else {
	res = res.status(401).json({message: "Appkey Was not provided."});
	// The appkey was not given by the application
	reject(res);
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
 let userDirectory = `${CONSTANTS.USER_DATA_DIRECTORY}/${username}`;
 let userDataFilePath = `${userDirectory}/user.json`;
 try{ 
  //Retrieving JSON file for the user.
  let userFile = await JSON.parse(FS.readFile(userDataFilePath));
  return userFile;
 }catch(error){
  UTIL.logAsync("The user.json for user: "+ username +" does not exist");
  return error;
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
}
