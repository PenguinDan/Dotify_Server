const USER_MIDDLEWARE = require('./user_middleware');
const MUSIC_MIDDLEWARE = require('./music_middleware');
const SEARCH_MIDDLEWARE = require('./search_middleware');
const UTILITIES = require('./helper/utilities');
let router;

const routing = function routing(express_router){
  router = express_router;

  // Default server entry message
  router.route('/').get(function(req, res) {
    res.json({ message: 'Welcome to the REST API of Dotify!!!' });
  });
  // Create the user
  router.route('/users').post(function (req, res) {
    // Create a unique value to log the request
    USER_MIDDLEWARE.createUser(req, res, true);
  });
  // Update the user password.
  router.route('/users').put(function (req, res) {
    USER_MIDDLEWARE.updateUser(req, res, true);
  });
  // Logs in the user based on their authentication information
  router.route('/users').get(function (req, res) {
    USER_MIDDLEWARE.getUser(req, res);
  });
  // Checks whether a username is available
  router.route('/users/check').get(function(req, res){
    USER_MIDDLEWARE.checkUsernameAvailability(req, res);
  });
  // Retrieves the security question for a user
  router.route("/users/reset").get(function(req, res){
    USER_MIDDLEWARE.getResetQuestions(req, res);
  });
  // Check the security question answers for the user with duplication filter
  router.route('/users/reset-check').get(function(req, res){
    // Retrieve the IP address of the request
    let requestIp = req.ip;
    // Check whether the request was already sent by the particular
    // ip address and that a response is still being made out
    UTILITIES.getSecurityAnswerQueue().then(async function(vals){
      let setObj = vals.set;
      let setJson = vals.json;
      if (!setObj.has(requestIp)){
        UTILITIES.logAsync("Checking security answers for " + requestIp);
        setObj.add(requestIp);
        // Save the security answers
        setJson.set = Array.from(setObj);
        await UTILITIES.saveSecurityAnswerQueue(setJson);
        USER_MIDDLEWARE.checkQuestionAnswers(req, res, true);
      } else {
        UTILITIES.logAsync("Security answer check request for ip address" + requestIp +
                        " already beging run");
      return null;
      }
    });
  });
  // Retrieve a user profile image from the user and save it
  router.route('/users/image').put(function(req, res){
    USER_MIDDLEWARE.saveUserProfileImage(req, res, true);
  });
  //Delete a playlist for the user.
  router.route('/playlist').delete(function(req, res) {
    MUSIC_MIDDLEWARE.deletePlaylist(req, res, true);
  });

  // Create a playlists for the user.
  router.route('/playlist').put(function(req, res) {
    MUSIC_MIDDLEWARE.createPlaylist(req, res, true);
  });

  // Get the playlists' of the user.
  router.route('/playlist').get(function(req, res) {
    MUSIC_MIDDLEWARE.getPlaylistList(req, res);
  });

  // Get the playlistspage of the user.
  router.route('/playlistpage').get(function(req, res) {
    MUSIC_MIDDLEWARE.getPlaylist(req, res);
  });

  // Add a song to the specified playlist.
  router.route('/playlistpage').put(function(req, res) {
    MUSIC_MIDDLEWARE.addSongToPlaylist(req, res, true);
  });

  //Delete a song from the specified playlist.
  router.route('/playlistpage').delete(function(req, res) {
    MUSIC_MIDDLEWARE.deleteSongFromPlaylist(req, res, true);
  });

  //Gets song information for requested son.
  router.route('/song').get(function(req, res) {
    MUSIC_MIDDLEWARE.getSong(req, res);
  });

  //Gets list of songs matching the search.
  router.route('/search').get(function(req, res) {
    SEARCH_MIDDLEWARE.getSearchResults(req, res);
  });

  //Gets a list of songs for an artist.
  router.route('/artist').get(function(req, res) {
    MUSIC_MIDDLEWARE.getArtist(req, res);
  });

  return router;
}


module.exports = routing;
