'use strict'
const HashMap = require('hashmap');

let testMap = new HashMap();

testMap.set("hello", "world");

let stringMap = JSON.stringify(testMap);

let newTestMap = new HashMap(JSON.parse(stringMap));

console.log(newTestMap);
