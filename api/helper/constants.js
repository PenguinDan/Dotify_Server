'use strict'

module.exports = {

  // The unique request codes
  CREATE_ACCOUNT_REQUEST : 0,
  UPDATE_USER_PASSWORD_REQUEST : 1,
  DELETE_PLAYLIST_REQUEST : 2,
  CREATE_PLAYLIST_REQUEST : 3,
  ADD_SONG_TO_PLAYLIST_REQUEST : 4,
  DELETE_SONG_FROM_PLAYLIST_REQUEST : 5,
  ADD_USER_PROFILE_IMAGE_REQUEST : 6,

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
  SONG_MUSIC_DIRECTORY : './api/models/songs/songdata',
  SONG_INFO_DIRECTORY : './api/models/songs/songinfo',
  ARTIST_INFO_DIRECTORY: '.api/models/songs/artistlist.txt',

  // Identify server configuration filepaths and directories
  CONFIG_FILEPATH : './api/config/config.json',
  SERVER_DATA_FILEPATH : './api/config/server_data.json',
  SECURITY_ANSWER_QUEUE_FILEPATH : './api/config/security_answer_queue.json',
  REQUEST_LOG_FILEPATH : './api/config/request_log.json',
  UDP_CONFIG_FILEPATH : './api/config/udp_ports.json',
  TCP_CONFIG_FILEPATH : './api/config/tcp_ports.json',

  // Identify server music filepaths and directory
  SONG_DATABASE_FILE : './api/models/Song_Database/Songs.json',
  ARTIST_DATABASE_FILE : './api/models/Song_Database/Artists.json',
  ALBUM_DATABASE_FILE : './api/models/Song_Database/Albums.json',
  GUID_MAPPING_FILE : './api/models/Song_Database/Guid_To_Info.json'
};
