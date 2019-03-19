const express = require('express');
const app = express();
const optimizelySDK = require('@optimizely/optimizely-sdk');
const session = require('express-session');
const pug = require('pug');
const DeviceDetector = require('node-device-detector');
const detector = new DeviceDetector;
const defaultLogger = require("@optimizely/optimizely-sdk/lib/plugins/logger");
const NOTIFICATION_TYPES = require("@optimizely/optimizely-sdk/lib/utils/enums").NOTIFICATION_TYPES;
const https = require('https');
const fs = require('fs');

var environment = process.argv[2] || 'production', dataFileUrl = 'https://cdn.optimizely.com/datafiles/FkWqpqrKKyLRVU1JgNB7y3.json', dataFileSyncTime = 1000 * 60, optimizelyClientInstance, userId, userAttributes = {};

var instantiateOptimizelyClient = function(callbackReturn) {
	retrieveDataFile(function(err, dataFile) {
		if (err) {

		} else {
			optimizelyClientInstance = optimizelySDK.createInstance({
				datafile: dataFile
			});

			if (environment === "dev") {
				optimizelyClientInstance.notificationCenter.clearAllNotificationListeners();
				optimizelyClientInstance.notificationCenter.addNotificationListener(NOTIFICATION_TYPES.ACTIVATE, onActivateListener);
				optimizelyClientInstance.notificationCenter.addNotificationListener(NOTIFICATION_TYPES.TRACK, onTrackListener);
			}

			callbackReturn(null, true);
		}

		setTimeout(function() {
			instantiateOptimizelyClient(function(){
				//
			});
		}, dataFileSyncTime);
	})
}

app.use(session({
	secret: 'UkZ8QX3j8zJ8UgJ84p7V2dDA',
	cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }, // 30 days
	resave: false,
	saveUninitialized: true
}));

app.set('view engine', 'pug');

app.get('/', function (req, res) {
	var data = JSON.parse(fs.readFileSync('./data.json'));
	establishUserInformation(req);

	var variation;
	if (typeof req.query['force-price_sort_test'] !== 'undefined') {
		if (optimizelyClientInstance.setForcedVariation('price_sort_test', userId, req.query['force-price_sort_test'])) {
			variation = optimizelyClientInstance.getForcedVariation('price_sort_test', userId);
		}
	} else {
		variation = optimizelyClientInstance.activate('price_sort_test', userId, userAttributes);
	}

	if (variation === 'price_sort_desc') {
		data.products.sort(function(a, b) {
			if (a.price > b.price) {
				return -1;
			}
			if (a.price < b.price) {
				return 1;
			}
			return 0;
		});
	} else if (variation === 'price_sort_asc') {
		data.products.sort(function(a, b) {
			if (a.price < b.price) {
				return -1;
			}
			if (a.price > b.price) {
				return 1;
			}
			return 0;
		});
	}

	res.render('index', {
		products: data.products
	})
});

app.get('/buy', function(req, res) {
	establishUserInformation(req);

	optimizelyClientInstance.track('bought_product', userId, userAttributes);

	res.redirect('/');
})

instantiateOptimizelyClient(function(err, result) {
	var server = app.listen(80, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Server listening at http://%s:%s', host, port);
	});
});

function retrieveDataFile(callbackReturn) {
	https.get(dataFileUrl, (resp) => {
		let data = '';

		resp.on('data', (chunk) => {
			data += chunk;
		});

		resp.on('end', () => {
			callbackReturn(null, data);
		});
	}).on("error", (err) => {
		callbackReturn(err, null);
	});
}


function establishUserInformation(req) {
	userId = req.sessionID;
	detector.detect(req.headers['user-agent']);

	userAttributes = {
		'is_mobile': detector.isMobile()
	};
}


function onActivateListener(activateObject) {
	console.log("Experiment activated", activateObject.experiment.key);
}


function onTrackListener(trackObject) {
	console.log("Tracking called", trackObject.eventKey);
}