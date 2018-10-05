const bcrypt = require('bcrypt');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const Constants = require('./constants');

async function testAsync(){
	try{
		let value = await fs.readFileAsync('./config/config.json');
		console.log(value);
	}catch(error){
		console.log("Error");
	}
}

class TestClass{
  constructor(){
    this.val = 1;
  }
}

test = new TestClass();

console.log(test.val);
