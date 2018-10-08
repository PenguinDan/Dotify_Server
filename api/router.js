const USER_MIDDLEWARE = require('./user_middleware');
const MUSIC_MIDDLEWARE = require('./music_middleware');
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
    USER_MIDDLEWARE.createUser(req, res);
  });
  // Update the user password.
  router.route('/users').put(function (req, res) {
    USER_MIDDLEWARE.updateUser(req, res);
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
  // Check the security question answers for the user
  router.route('/users/reset-check').get(function(req, res){
    USER_MIDDLEWARE.checkQuestionAnswers(req, res);
  });
  //Delete a playlist for the user.
  router.route('/playlist').delete(function(req, res) {
    MUSIC_MIDDLEWARE.deletePlaylist(req, res);
  });

  // Create a playlists for the user.
  router.route('/playlist').put(function(req, res) {
    MUSIC_MIDDLEWARE.createPlaylist(req, res);
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
    MUSIC_MIDDLEWARE.addSongToPlaylist(req, res);
  });

  //Delete a song from the specified playlist.
  router.route('/playlistpage').delete(function(req, res) {
    MUSIC_MIDDLEWARE.deleteSongFromPlaylist(req, res);
  });

  return router;
}


module.exports = routing;
