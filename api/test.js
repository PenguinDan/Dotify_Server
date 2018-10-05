const bcrypt = require('bcrypt');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const Constants = require('./constants');
const CRYPTO = require('crypto');


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

  static async testMethod(){
    let anotherValue = await CRYPTO.randomBytes(48);
    anotherValue = anotherValue.toString('base64');
    return anotherValue;
  }
}

async function test2Async(){
  let val = await TestClass.testMethod();
  console.log(val);
}

test2Async();

