'use strict'

const bc = require('buffer-chunks');

let testval = bc(new Buffer("hello world"), 5);

console.log(testval);
