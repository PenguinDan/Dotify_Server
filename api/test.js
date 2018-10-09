'use strict'
const HashMap = require('hashmap');

let testMap = new HashMap();

testMap.set("hello", "world");
testMap.set("world", "hello");
testMap.delete("hello");

let stringMap = JSON.stringify(testMap);

let newTestMap = new HashMap(JSON.parse(stringMap));

console.log(newTestMap);
