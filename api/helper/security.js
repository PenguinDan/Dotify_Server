'use strict'

// Import modules
const CRYPTO = require('crypto');

class ResetToken{
  // Constructor for the ResetToken object
  // @Param:
  //  tokenVal: The token value to be stored
  //  expiration: The expiration time
  constructor(tokenVal, expiration){
    this.token = tokenVal;
    this.expirationTime = expiration;
  }

  // Generates a cryptographically strong random key with the specified
  // byte length
  // @Param:
  //    byteLength: The byte length value that the key should contain
  // @Return:
  //    A cryptographically strong random key
  static async generateToken(byteLength){
    let token = await CRYPTO.randomBytes(byteLength);
    return token.toString('base64');
  }
}

module.exports = {
  ResetToken
}
