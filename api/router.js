const USER_MIDDLEWARE = require('./user_middleware');
const MUSIC_MIDDLEWARE = require('./music_middleware');
let router;

const routing = function routing(express_router){
  router = express_router;

  // Default server entry message
  router.route('/').get(function(req, res) {
    res.json({ message: 'Welcome to the REST API of Dotify' });
  });
  // Create the user
  router.route('/users').post(function (req, res) {
    USER_MIDDLEWARE.createUser(req, res);
  });
  // Update the user
  router.route('/users').put(function (req, res) {
    USER_MIDDLEWARE.updateUser(req, res);
  });
  // Get the user
  router.route('/users').get(function (req, res) {
    USER_MIDDLEWARE.getUser(req, res);
  });
  return router;
}


module.exports = routing;
