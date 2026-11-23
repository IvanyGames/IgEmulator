var mongoClient = require("mongodb").MongoClient;
var xmppNodeComponent = require('node-xmpp-component');

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

var config = require(configPath);

var db;

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

							loadXmppConnection();
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

function loadXmppConnection() {

	console.log('[Component]:Connecting...')

	var xmppComponent = new xmppNodeComponent(config.component);

	xmppComponent.on('stanza', function (stanza) {
		//console.log('[Component]:Stanza')
		//console.log(stanza+"")
		switch (stanza.attrs.type) {
			case 'get':
				switch (stanza.name) {
					case "iq":
						switch (stanza.attrs.xmlns) {
							case "jabber:client":
								if (stanza.children[0] != null) {
									switch (stanza.children[0].name) {
										case "query":
											switch (stanza.children[0].attrs.xmlns) {
												case "urn:cryonline:k01":
													if (stanza.children[0].children[0] != null) {
														switch (stanza.children[0].children[0].name) {
															case "message":

																db.warface.profiles.findOne({ username: stanza.attrs.from.split("@")[0] }, { projection: { "nick": 1 } }, function (errProfileSender, resultProfileSender) {

																	if (errProfileSender) {
																		console.log("[" + stanza.attrs.from + "][Message]:Failed to getting sender data from the database");
																		return;
																	}

																	if (!resultProfileSender) {
																		console.log("[" + stanza.attrs.from + "][Message]:Sender profile not found");
																		return;
																	}

																	db.warface.profiles.findOne({ nick: stanza.children[0].children[0].attrs.nick }, { projection: { "username": 1 } }, function (errProfile, resultProfile) {

																		if (errProfile) {
																			console.log("[" + stanza.attrs.from + "][Message]:Failed to getting target data from the database");
																			return;
																		}

																		if (!resultProfile) {
																			//console.log("[" + stanza.attrs.from + "][Message]:Target profile not found");
																			return;
																		}

																		stanza.children[0].children[0].attrs.from = resultProfileSender.nick;
																		stanza.attrs.to = resultProfile.username + "@warface/GameClient";
																		xmppComponent.send(stanza);

																	});

																});

																break;
														}

													}
													break;
											}
											break;

									}
								}
								break;

						}
						break;

				}
				break;
		}

	})

	xmppComponent.on('online', function () {
		console.log('[Component]:Online')
	})

	xmppComponent.on('offline', function () {
		console.log('[Component]:Offline')
	})

	xmppComponent.on('connect', function () {
		console.log('[Component]:Connected')
	})

	xmppComponent.on('reconnect', function () {
		console.log('[Component]:Reconnect...')
	})

	xmppComponent.on('disconnect', function (e) {
		console.log("[Component]:Disconnect")
	})

	xmppComponent.on('error', function (e) {
		console.error(e)
		process.exit(1)
	})

	process.on('exit', function () {
		xmppComponent.end()
	})
}