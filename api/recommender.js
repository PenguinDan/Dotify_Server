'use strict'

// Adds the one hot encoded vector given by the user
// to their data list
let addUserMusicData = async function(message){
  // Retrieve the username in which we want to update the
  // the reccomendations for
  let username = message.username;
  // If the username doesn't exist then just stop the function
  if (util.userExists(username)){
    let userJson = await util.getUserDataFile(username);
  }
}
