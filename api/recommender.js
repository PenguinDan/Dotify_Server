'use strict'

const UTIL = require('./helper/utilities');

// Adds the one hot encoded vector given by the user
// to their data list
let addUserMusicData = async function(message){
  // Retrieve the username in which we want to update the
  // the reccomendations for
  let username = message.username;
  try{
    // If the username doesn't exist then just stop the function
    if (util.userExists(username)){
      let recommender = await UTIL.getUserRecommenderFile(username);
      // Add the one hot encoded vector
      recommender.push(message.ohe);
      // Save the changes
      await UTIL.saveUserRecommenderFile(username, recommender);
    }
  } catch(error){
    UTIL.logAsync(error.message);
  }
}
