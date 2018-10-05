'use strict'

module.exports = {
  // Identify Request code constants
  USER_NOT_FOUND_CODE : 901,
  USER_FOUND_CODE : 900,

  // HTTP Success codes
  OK : 200,
  CREATED : 201,
  ACCEPTED : 202,
  NON_AUTHORITATIVE_INFO : 203,
  NO_CONTENT : 204,
  RESET_CONTENT : 205,
  PARTIAL_CONTENT : 206,

  // HTTP Client Error Codes
  BAD_REQUEST : 400,
  UNAUTHORIZED : 401,
  FORBIDDEN : 403,
  NOT_FOUND : 404,
  METHOD_NOT_ALLOWED : 405,
  NOT_ACCEPTABLE : 406,

  // HTTP Server Error Codes
  INTERNAL_SERVER_ERROR : 500,

  // Identify server user filepaths and directory
  USER_DATA_DIRECTORY : './api/models/users/',

  // Identify server configuration filepaths and directories
  CONFIG_FILEPATH : './api/config/config.json',
  SERVER_DATA_FILEPATH : './api/config/server_data.json',

  // Identify server music filepaths and directory
  SONG_DATA_DIRECTORY : './api/models/songs/'
};
