const USER_MIDDLEWARE = require('./user_middleware');
const MUSIC_MIDDLEWARE = require('./music_middleware');
const UTILITIES = require('./utilities');
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
  // Update the user
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
  // Get the playlists' of the user.
  router.route('/playlist').get(function(req, res) {
    MUSIC_MIDDLEWARE.getPlaylist(req, res);
  });
  return router;
}


module.exports = routing;
