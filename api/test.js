
let testString = {
  "array" : []
}

testString = JSON.stringify(testString);
testString = JSON.parse(testString);

arr = testString.array;

console.log(arr);

arr.push([1,2,3,4,5]);
arr.push([1,2,3,4,5]);

console.log(arr);
