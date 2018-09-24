'use strict'

// Modules
const MONGOOSE = require('mongoose');
const HTTP = require('http');
const EXPRESS = require('express');
const ROUTES = require('./api/router');
const BODY_PARSER = require('body-parser');
const FS = require('fs');

// Constant variables
const SERVER_PORT = 3000;

const app = EXPRESS();
app.use(BODY_PARSER.urlencoded({ extended: true}));
app.use(BODY_PARSER.json());

const ROUTER = ROUTES(EXPRESS.Router());
app.use('/', ROUTER);

app.listen(SERVER_PORT);
console.log(`Running on port: ${SERVER_PORT}`);

