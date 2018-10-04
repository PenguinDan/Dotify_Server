function testPromise(){
	return new Promise(function(resolve, reject){
		resolve(1);
	});
}

async function testAsync(){
	let value = await testPromise();
	console.log(value);
}

testAsync();
