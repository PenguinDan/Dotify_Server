# Dotify_Server
The backend server for Dotify


## Requirements
1. [Node.js] v8.12.0+
2. [npm] v6.4.1

## Overview
Uses https request for CRUD of users, songs and playlists for Dotify application.

### For all routes
 * Required parameters
   * Request header
     * `appKey`: JSON Web Token for application


### Create User
Route: __POST__ https://dotify.online/users
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `password`: Password for the user account.
    * `securityQuestion1`: The first security question for the user account.
    * `securityQuestion2`: The second security question for the user account.
    * `securityAnswer1`: The first security answer for the user account.
    * `securityAnswer2`: The second security answer for the user account.
### Update User Information
Route: __PUT__ https://dotify.online/users
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `password`: Password for the user account.
### Get User Information    
Route: __GET__ https://dotify.online/users
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `password`: Password for the user account.

### Check Username Availability        
Route: __GET__ https://dotify.online/users/check
* Required parameters
  * Request body
    * `username`: Username for the user account.
    
    
### Retrieves the User Reset Questions
Route: __GET__ https://dotify.online/users/reset
* Required parameters
  * Request body
    * `username`: Username for the user account.

### Check Security Question Answers
Route: __GET__ https://dotify.online/users/reset-check
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `securityAnswer1`: The first security answer for the user account.
    * `securityAnswer2`: The second security answer for the user account.

### Update/Save Profile Image
Route: __PUT__ https://dotify.online/users/image
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `image`: Image to be updated or saved.
    
### Retrieve All Playlist User
Route: __GET__ https://dotify.online/playlist
* Required parameters
  * Request body
    * `username`: Username for the user account.
    
### Create a Playlist for User
Route: __PUT__ https://dotify.online/playlist
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `playlist`: Name of the playlist being created.

### Delete a Playlist for User
Route: __DELETE__ https://dotify.online/playlist
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `playlist`: Name of the playlist being deleted.
    
### Retrieve Specific Playlist
Route: __GET__ https://dotify.online/playlistpage
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `playlist`: Name of the playlist being retrieved.
    
### Add a Song to Specific Playlist
Route: __PUT__ https://dotify.online/playlistpage
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `playlist`: Name of the playlist to add song to.
    * `song`: Song ID for the song being added.
    
 ### Delete a Song from a Specific Playlist
Route: __DELETE__ https://dotify.online/playlistpage
* Required parameters
  * Request body
    * `username`: Username for the user account.
    * `playlist`: Name of the playlist to delete song from.
    * `songid`: Song ID for the song being deleted.
    
 ### Retrieve Song Information
Route: __DELETE__ https://dotify.online/playlistpage
* Required parameters
  * Request body
    * `songid`: The ID of the song to retrieve information for.

 ### Retrieve Artist Information
Route: __GET__ https://dotify.online/artist
* Required parameters
  * Request body
    * `artist`: The name of the artist to retrieve information for.

 ### Retrieve Search Results
Route: __GET__ https://dotify.online/search
* Required parameters
  * Request body
    * `search`: The search being requested(song or artist).

 ## Codes
 ### HTTP Success codes
  * `200`: OK 
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
  * `406`: Not acceptable request
  * `400`: Bad request parameters
  * `500`: Internal service error
    
