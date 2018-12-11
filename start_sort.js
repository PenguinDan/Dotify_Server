// MODULES
const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');

const NODE_PROTO_PATH = __dirname + '/api/Proto/NodePb.proto';
const nodePackageDefinition = protoLoader.loadSync(
    NODE_PROTO_PATH,
    {
        keepCase : true,
        longs : String,
        enums : String,
        defaults : true,
        oneofs : true
    }
);

// Constants
const SERVER_GRPC_PORT = 50002;

// Functions
const grpcToServer = grpc.loadPackageDefinition(nodePackageDefinition).NodePb;
const toServer = new grpcToServer.ServerRequests(`0.0.0.0:${SERVER_GRPC_PORT}`, grpc.credentials.createInsecure());
toServer.sort({}, function(err, response) {
    if (err) {
        console.log(err); 
    } else {
        console.log("SUCCESS");
    }
});