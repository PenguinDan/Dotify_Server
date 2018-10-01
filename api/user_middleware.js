// Modules
const util = require('./utilities');

let createUser = function(req, res){
  // Instatiates an authentication promise
  util.authenticateApp(req, res).then(function(result){
    // Check how many users there are in the server
    userCount = util.getUserCount();
    util.logAsync("Creating User");
    return res.status(200).json({message: userCount});
  }).catch(function(result){
    return res;
  });
}

let updateUser = function(req, res){
}

let getUser = function(req, res){
}
module.exports = {
  createUser,
  updateUser,
  getUser
};
