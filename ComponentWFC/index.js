var mongoClient = require("mongodb").MongoClient;
var xmppNodeComponent = require('node-xmpp-component');

var config = require('./config.json');

var db;

function loadDb() {
	db = {};
	console.log("[MongoDb]:Connecting...");

	var mongoConnectionAttrs = { useNewUrlParser: true, useUnifiedTopology: true};

	if(require("mongodb/lib/connection_string.js").OPTIONS.reconnectTries){
		mongoConnectionAttrs.reconnectTries = Number.MAX_VALUE;
	}

	mongoClient.connect(config.mongodb, mongoConnectionAttrs, function (err, dbClient) {
		if (dbClient != null) {
			//console.log("[MongoDb]:Connected");
			db.warface = {};
			db.warface.profiles = dbClient.db("warface").collection("profiles");
			loadXmppConnection();
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