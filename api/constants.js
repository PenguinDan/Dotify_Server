// Identify Request code constants
const USER_NOT_FOUND_CODE = 901;
const USER_FOUND_CODE = 900;

// Identify server user filepaths and directory
const USER_DATA_DIRECTORY = './api/models/users/';

// Identify server configuration filepaths and directories
const CONFIG_FILEPATH = './api/config/config.json';
const SERVER_DATA_FILEPATH = './api/config/server_data.json';

// Identify server music filepaths and directory
const SONG_DATA_DIRECTORY = './api/models/songs/';

module.exports = {
  USER_NOT_FOUND_CODE,
  SERVER_DATA_FILEPATH,
  USER_DATA_DIRECTORY,
  CONFIG_FILEPATH,
  SONG_DATA_DIRECTORY,
  USER_FOUND_CODE
};
