var express = require('express');
var app = express();
var optimizelySDK = require('@optimizely/optimizely-sdk');
var session = require('express-session');
var pug = require('pug');

var optimizelyClientInstance = optimizelySDK.createInstance({
	datafile: {
		uri: 'https://cdn.optimizely.com/datafiles/FkWqpqrKKyLRVU1JgNB7y3.json',
		json: true
	}
});

app.use(session({
	secret: 'UkZ8QX3j8zJ8UgJ84p7V2dDA',
	cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }, // 30 days
	resave: false,
	saveUninitialized: true
}));

app.set('view engine', 'pug');

app.get('/', function (req, res) {
	res.render('index', {})
});

var server = app.listen(80, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Server listening at http://%s:%s', host, port);
});