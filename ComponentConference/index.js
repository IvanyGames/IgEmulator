const Component = require('node-xmpp-component')
const ltx = require('ltx')
var mongoClient = require("mongodb").MongoClient;

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

const config = require(configPath);

var chats = {};

//Максимальное количество пользователей при котором возможна обмена presence сообщениями (Нужно для работы вкладки "Игроки в сети").Не рекомендуется ставить больше чем 200 т.к клиент не потдерживает больше,и это вызывает перегрузку prosody.
var presence_max_users = 1000;

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

							connect_to_prosody();
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

//Функция подключения к Prosody
function connect_to_prosody() {
	//Настройки k01
	const options_component = config.component;

	var component = new Component(options_component)
	component.on('stanza', function (stanza) {
		//console.log(stanza+"\n");
		var chat_id = stanza.attrs.to.split('@')[0];
		var users_count = 0;
		for (user in chats[chat_id]) {
			users_count++;
		}
		if (stanza.name == "presence") {
			if (stanza.attrs.type == null) {
				var username = stanza.attrs.from.split('@')[0];
				global.db.warface.profiles.findOne({ username: username }, { projection: { "nick": 1 } }, function (err, profile_db) {
					if (profile_db != null) {
						if (chats[chat_id] == null || chats[chat_id][stanza.attrs.from] == null) {
							if (chats[chat_id] == null) {
								chats[chat_id] = {};
							}
							chats[chat_id][stanza.attrs.from] = profile_db.nick;
							if (users_count <= presence_max_users) {
								for (user in chats[chat_id]) {
									var p_to_send = new ltx.Element('presence', { "to": user, "from": chat_id + "@" + config.component.jid + "/" + profile_db.nick }); p_to_send.c("priority").t("0"); p_to_send.c("c", { ver: "0RyJmsC2EQAjYmYlhkMGaVEgE/8=", hash: "sha-1", node: "http://camaya.net/gloox", xmlns: "http://jabber.org/protocol/caps" }); p_to_send.c("x", { xmlns: "http://jabber.org/protocol/muc#user" }).c("item", { jid: stanza.attrs.from, affiliation: "node", role: "none" }); component.send(p_to_send);
									var p_to_send1 = new ltx.Element('presence', { "to": stanza.attrs.from, "from": chat_id + "@" + config.component.jid + "/" + chats[chat_id][user] }); p_to_send1.c("priority").t("0"); p_to_send1.c("c", { ver: "0RyJmsC2EQAjYmYlhkMGaVEgE/8=", hash: "sha-1", node: "http://camaya.net/gloox", xmlns: "http://jabber.org/protocol/caps" }); p_to_send1.c("x", { xmlns: "http://jabber.org/protocol/muc#user" }).c("item", { jid: user, affiliation: "node", role: "none" }); component.send(p_to_send1);
								}
							}
							//console.log(`[${chat_id}][${stanza.attrs.from}][${profile_db.nick}][Joined]`);
						}
					} else {
						//console.log(`[${chat_id}][${stanza.attrs.from}][Not found in db]`);
					}
				});
			} else if (stanza.attrs.type == "unavailable") {
				if (chats[chat_id] != null && chats[chat_id][stanza.attrs.from] != null) {
					var name = chats[chat_id][stanza.attrs.from];
					delete chats[chat_id][stanza.attrs.from];
					var users_count_ch = 0;
					for (user in chats[chat_id]) {
						if (users_count <= presence_max_users) {
							var p_to_send = new ltx.Element('presence', { "to": user, "from": chat_id + "@" + config.component.jid + "/" + name, type: "unavailable" }); p_to_send.c("x", { xmlns: "http://jabber.org/protocol/muc#user" }).c("item", { jid: stanza.attrs.from, affiliation: "node", role: "none" }); p_to_send.c("status", { code: "110" }); component.send(p_to_send);
						}
						users_count_ch++;
					}
					if (users_count_ch == 0) {
						delete chats[chat_id];
					}
					//console.log(`[${chat_id}][${stanza.attrs.from}][${name}][Leaved]`);
				}
			}
		} else if (stanza.name == "message" && stanza.attrs.type == "groupchat" && stanza.children[0] != null && stanza.children[0].name == "body") {
			var message = stanza.children[0].getText();
			if (chats[chat_id] != null && chats[chat_id][stanza.attrs.from] != null && message != null) {
				var name = chats[chat_id][stanza.attrs.from];
				//console.log(`[${chat_id}][${name}][message]:${message}`);	
				for (user in chats[chat_id]) {
					var p_to_send = new ltx.Element('message', { "to": user, "from": chat_id + "@" + config.component.jid + "/" + name, type: "groupchat" }); p_to_send.c("body").t(message); component.send(p_to_send);
				}
			}
		} else if (stanza.name == "iq" && stanza.attrs["xmlns:stream"] == "http://etherx.jabber.org/streams" && stanza.children[0] != null && stanza.children[0].name == "query") {
			var query = stanza.children[0];
			if (query.attrs.xmlns == "http://jabber.org/protocol/disco#items") {
				if (chats[chat_id] != null) {
					var p_to_send = new ltx.Element('iq', { "to": stanza.attrs.from, "from": chat_id + "@" + config.component.jid, type: "result", id: stanza.attrs.id });
					var query_c = p_to_send.c("query", { xmlns: "http://jabber.org/protocol/disco#items" });
					for (user in chats[chat_id]) {
						query_c.c("item", { jid: chat_id + "@" + config.component.jid + "/" + chats[chat_id][user], name: chats[chat_id][user] });
					}
					component.send(p_to_send);
				}
			}
		} else if (stanza.name == "iq" && stanza.attrs.type == "get" && stanza.children[0] != null && stanza.children[0].name == "ping" && stanza.children[0].attrs.xmlns == "urn:xmpp:ping") {
			component.send(new ltx.Element('iq', { "to": stanza.attrs.from, type: "result", id: stanza.attrs.id }));
		}
	})
	component.on('online', function () {
		console.log('[' + options_component.jid + ']:Online')
	})

	component.on('offline', function () {
		//console.log('['+options_component.jid+']:Offline')
	})

	component.on('connect', function () {
		console.log('[' + options_component.jid + ']:Connected')
	})

	component.on('reconnect', function () {
		//console.log('['+options_component.jid+']:Reconnect...')
	})

	component.on('disconnect', function (e) {
		console.log('[' + options_component.jid + ']:Disconnect:', e)
	})

	component.on('error', function (e) {
		console.error(e)
		process.exit(1)
	})

	process.on('exit', function () {
		component.end()
	})
}