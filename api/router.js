const MIDDLEWARE = require('./middleware');

let router;

const routing = function routing(express_router){
  router = express_router;

  router.route('/').get(function(req, res) {
    res.json({ message: 'Welcome to the REST API of Dotify' });
  });

  return router;
}


module.exports = routing;
