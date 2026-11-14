var mongoClient = require("mongodb").MongoClient;
var xmppNodeClient = require('node-xmpp-client');
var ltx = require("ltx");

var xmppCore = require("./core.js");

global.startupParams = {};
for (argKey in process.argv) {
	var argData = process.argv[argKey].split("=")
	if (argData.length == 2) {
		global.startupParams[argData[0]] = argData[1];
	}
}

var configPath = "./config.json";

if (global.startupParams.config) {
	configPath = global.startupParams.config;
}

global.config = require(configPath);

var scriptResources = require('./scripts/resources.js');
var scriptXmpp = require('./scripts/xmpp.js')
var scriptCache = require('./scripts/cache.js');
var scriptTimers = require('./scripts/timers.js');

function initGlobalVars() {
	global.users = { jid: {}, _id: {} };

	global.gamerooms = [];
	global.roomId = 1;
	global.roomBrowserCacheToken = 1;
	global.roomBrowserCacheArr = [];

	global.arrRoomInvitations = [];

	global.dedicatedServersObject = {};
	global.sessionId = 1;

	global.sessions_data = {};
}
initGlobalVars();

scriptResources.load();

function loadDb() {

	global.db = {};
	console.log("[MongoDb]:Connecting");

	var mongoConnectionAttrs = { useNewUrlParser: true, useUnifiedTopology: true };

	if (require("mongodb/lib/connection_string.js").OPTIONS.reconnectTries) {
		mongoConnectionAttrs.reconnectTries = Number.MAX_VALUE;
	}

	mongoClient.connect(config.mongodb, mongoConnectionAttrs, function (err, dbClient) {

		if (dbClient != null) {

			global.db.warface = {};
			global.db.warface.profiles = dbClient.db("warface").collection("profiles_" + global.startupParams.locale + "_" + global.startupParams.ver);
			global.db.warface.cache = dbClient.db("warface").collection("cache_" + global.startupParams.locale + "_" + global.startupParams.ver);
			global.db.warface.clans = dbClient.db("warface").collection("clans_" + global.startupParams.locale + "_" + global.startupParams.ver);
			global.db.warface.hwban = dbClient.db("warface").collection("hwban");

			console.log("[MongoDb]:Initializing 'profiles'");

			global.db.warface.profiles.createIndexes([{ key: { _id: 1 }, name: "_id_" }, { key: { username: 1 }, name: "_username_", unique: true }, { key: { nick: 1 }, name: "_nick_", unique: true }, { key: { clan_name: 1 }, name: "_clan_name_" }], function (errCreateProfilesIndexes) {

				if (errCreateProfilesIndexes) {
					console.log(errCreateProfilesIndexes);
					throw "";
				}

				console.log("[MongoDb]:Initializing 'clans'");

				global.db.warface.clans.createIndexes([{ key: { _id: 1 }, name: "_id_" }, { key: { name: 1 }, name: "_name_", unique: true }], function (errCreateClansIndexes) {

					if (errCreateClansIndexes) {
						console.log(errCreateClansIndexes);
						throw "";
					}

					console.log("[MongoDb]:Initializing 'cache'");

					global.db.warface.cache.createIndexes([{ key: { _id: 1 }, name: "_id_" }], function (errCreateCacheIndexes) {

						if (errCreateCacheIndexes) {
							console.log(errCreateCacheIndexes);
							throw "";
						}

						console.log("[MongoDb]:Initializing 'hwban'");

						global.db.warface.hwban.createIndexes([{ key: { _id: 1 }, name: "_id_" }], function (errCreateHwbanIndexes) {

							if (errCreateHwbanIndexes) {
								console.log(errCreateHwbanIndexes);
								throw "";
							}

							initCache();
						});

					});

				});
			});
		} else {
			console.log("[MongoDb]:Connect error -> " + err.message);
			setTimeout(function () {
				loadDb();
			}, 1000);
		}
	});
}
loadDb();

function initCache() {
	scriptCache.init(function () {
		loadXmppConnection(global.config.masterserver.host, global.config.masterserver.port, global.config.masterserver.domain, global.config.masterserver.username, global.config.masterserver.password, global.startupParams.resource);
	});
}

function loadXmppConnection(xmppHost, xmppPort, xmppDomain, xmppUsername, xmppPassword, xmppResource) {

	var xmppOptions = {
		jid: xmppUsername + "@" + xmppDomain + "/" + xmppResource,
		password: xmppPassword,
		preferred: 'PLAIN',
		host: xmppHost,
		port: xmppPort,
		reconnect: true
	}

	console.log('[Masterserver]:Connecting')

	global.xmppClient = new xmppNodeClient(xmppOptions)

	scriptXmpp.init(global.xmppClient);
	scriptTimers.init();

	global.xmppClient.on('stanza', function (stanza) {
		//console.time("t");
		xmppCore.module(stanza);
		//console.timeEnd("t");
	})

	global.xmppClient.on('online', function () {
		console.log('[Masterserver]:Online')
		scriptTimers.sendMasterserverInfo();
	})

	global.xmppClient.on('offline', function () {
		console.log('[Masterserver]:Offline')
	})

	global.xmppClient.on('connect', function () {
		console.log('[Masterserver]:Connected')
	})

	global.xmppClient.on('reconnect', function () {
		console.log('[Masterserver]:Reconnect...')
	})

	global.xmppClient.on('disconnect', function (e) {
		console.log("[Masterserver]:Disconnect")
		initGlobalVars();
	})

	global.xmppClient.on('error', function (e) {
		console.error(e)
		process.exit(1)
	})

	process.on('exit', function () {
		global.xmppClient.end()
	})

}