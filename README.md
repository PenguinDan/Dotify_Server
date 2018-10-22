# Dotify_Server
The backend server for Dotify

## Requirements
1. [Node.js] v8.12.0
2. [npm] v6.4.1

## Routes
### For all requests
* Required parameters
  * Request header
    * `appKey`: JSON Web Token for application
    
### Create a User
* Route: __POST__ https://dotify.online/users
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `password` : Password for the user.
    * `securityQuestion1` : First security question for forget password.
    * `securityAnswer1` : Answer to security question 1.
    * `securityQuestion2` : Second security question for forget password.
    * `securityAnswer2` : Answer to security question 2.
### Update User Password
* Route: __PUT__ https://dotify.online/users
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `password` : Password for the user.

### Get User Information
* Route: __GET__ https://dotify.online/users
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `password` : Password for the user.
    
### Check Username Availability
* Route: __GET__ https://dotify.online/users/check
* Required Parameters
  * Request Body
    * `username` : Username of the user.

### Reset User 
* Route: __GET__ https://dotify.online/users/reset
* Required Parameters
  * Request Body
    * `username` : Username of the user.

### Check Security Question Answers
* Route: __GET__ https://dotify.online/users/reset-check
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `securityAnswer1` : Answer to security question 1.
    * `securityAnswer2` : Answer to security question 2.
 
### Saves User Profile Image
* Route: __PUT__ https://dotify.online/users/image
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `image` : The image to set for profile image.
     
### Gets All Playlist for User
* Route: __GET__ https://dotify.online/users/playlist
* Required Parameters
  * Request Body
    * `username` : Username of the user.
      
### Creates a Playlist for User
* Route: __PUT__ https://dotify.online/users/playlist
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `playlist` : Name of the playlist.
    
### Deletes a Playlist for User
* Route: __DELETE__ https://dotify.online/users/playlist
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `playlist` : Name of the playlist.
      
### Get Playlist Information
* Route: __GET__ https://dotify.online/users/playlistpage
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `playlist` : Name of the playlist.
      
### Adds song to Playlist
* Route: __PUT__ https://dotify.online/users/playlistpage
* Required Parameters
  * Request Body
    * `username` : Username of the user.
    * `playlist` : Name of the playlist.
    * `songid` : Song ID for song to add.
    
    
### Get Song Information
* Route: __GET__ https://dotify.online/users/song
* Required Parameters
  * Request Body
    * `songid` : Song ID for song to delete.
    
### Get Search Results
* Route: __GET__ https://dotify.online/users/search
* Required Parameters
  * Request Body
    * `search` : The search query(song or artist).
    
### Get Artist Information
* Route: __GET__ https://dotify.online/users/artist
* Required Parameters
  * Request Body
    * `artist` : The name of the artist being retrieved.
    
## Codes
### Identify Request code constants
  * `901`: USER_NOT_FOUND_CODE
  * `900`: USER_FOUND_CODE

### HTTP Success codes
  * `200`:OK
  * `201`: CREATED
  * `202`: ACCEPTED
  * `203`: NON_AUTHORITATIVE_INFO
  * `204`: NO_CONTENT 
  * `205`: RESET_CONTENT 
  * `206`: PARTIAL_CONTENT 

### HTTP Client Error Codes
  * `400`: BAD_REQUEST
  * `401`: UNAUTHORIZED 
  * `403`: FORBIDDEN 
  * `404`: NOT_FOUND
  * `405`: METHOD_NOT_ALLOWED 
  * `406`: NOT_ACCEPTABLE 

### HTTP Server Error Codes
  * `500`: INTERNAL_SERVER_ERROR 


