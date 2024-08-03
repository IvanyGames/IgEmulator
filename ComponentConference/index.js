var mongoClient = require("mongodb").MongoClient;
var xmppNodeComponent = require('node-xmpp-component');
var ltxElement = require('ltx').Element

var config = require('./config.json');

var chatsObject = {};

var db;

function loadDb() {
	db = {};
	console.log("[MongoDb]:Connecting...");
	//reconnectTries: Number.MAX_VALUE
	mongoClient.connect(config.mongodb, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, dbClient) {
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
		//console.time("t");
		//console.log('[Component]:Stanza')
		//console.log(String(stanza));

		if (stanza.name == "presence") {
			if (stanza.attrs.type == null) {
				db.warface.profiles.findOne({ username: stanza.attrs.from.split('@')[0] }, { projection: { "nick": 1, "mute": 1 } }, function (errProfile, resultProfile) {

					if (errProfile) {
						//console.log("[" + stanza.attrs.from + "][Presence][Profile]:Failed to getting data from the database");
						return;
					}

					if (!resultProfile) {
						//console.log("[" + stanza.attrs.from + "][Presence][Profile]:Target profile not found");
						return;
					}

					var chat_id = stanza.attrs.to.split('@')[0];

					if (!chatsObject[chat_id]) {
						chatsObject[chat_id] = {};
					}

					chatsObject[chat_id][stanza.attrs.from] = { nick: resultProfile.nick, time: resultProfile.mute.time };

					//console.log("[" + stanza.attrs.from + "][Presence]:User '" + resultProfile.nick + "' joined to '" + chat_id + "'");
				});
			} else if (stanza.attrs.type == "unavailable") {

				var chat_id = stanza.attrs.to.split('@')[0];

				if (!chatsObject[chat_id]) {
					return;
				}

				delete chatsObject[chat_id][stanza.attrs.from];

				//console.log("[" + stanza.attrs.from + "][Presence]:User left from '" + chat_id + "'");

				var users_count = 0;

				for (user in chatsObject[chat_id]) {
					users_count++;
				}

				if (users_count == 0) {
					delete chatsObject[chat_id];
				}
			}
		} else if (stanza.name == "message" && stanza.attrs.type == "groupchat" && stanza.children[0] != null && stanza.children[0].name == "body") {

			var chat_id = stanza.attrs.to.split('@')[0];
			var message = stanza.children[0].getText();

			if (!chatsObject[chat_id] || !chatsObject[chat_id][stanza.attrs.from] || !message || chatsObject[chat_id][stanza.attrs.from].time > Math.round(new Date().getTime() / 1000)) {
				return;
			}

			var elementMessage = new ltxElement('message', { from: chat_id + "@" + config.component.jid + "/" + chatsObject[chat_id][stanza.attrs.from].nick, type: "groupchat" })
			elementMessage.c("body").t(message);

			for (userKey in chatsObject[chat_id]) {
				elementMessage.attrs.to = userKey;
				xmppComponent.send(elementMessage);
			}
		} else if (stanza.name == "mute" || stanza.attrs.from == "warface") {
			fChats: for (chatKey in chatsObject) {
				fUsers: for (userKey in chatsObject[chatKey]) {
					if (userKey == stanza.attrs.target) {
						chatsObject[chatKey][userKey].time = Number(stanza.attrs.time);
						break fChats;
					}
				}
			}
		}
		//console.timeEnd("t");
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