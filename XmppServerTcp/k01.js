var Element = require('./element.js');
var moduleStanza = require('./stanza');

global.masterserversArr = [];
global.quickplayObjectsArr = [];

var componentQueryId = 1;

exports.module = function (connection, stanza) {
	switch (stanza.attrs.type) {
		case 'get':
			switch (stanza.name) {
				case "iq":
					if (stanza.attrs.xmlns == null) {
						stanza.attrs.xmlns = "jabber:client";
					}
					switch (stanza.attrs.xmlns) {
						case "jabber:client":
							if (stanza.children[0] != null) {
								switch (stanza.children[0].name) {
									case "query":
										switch (stanza.children[0].attrs.xmlns) {
											case "urn:cryonline:k01":
												if (stanza.children[0].children[0] != null) {
													switch (stanza.children[0].children[0].name) {
														case "account":
															handlerQueryAccount(connection, stanza);
															break;
														case "get_master_server":
															handlerQueryGetMasterServer(connection, stanza);
															break;
														case "get_master_servers":
															handlerQueryGetMasterServers(connection, stanza);
															break;
														case "create_profile":
															handlerQueryCreateProfile(connection, stanza);
															break;
														case "join_channel":
															handlerQueryJoinChannel(connection, stanza);
															break;
														case "switch_channel":
															handlerQuerySwitchChannel(connection, stanza);
															break;
														case "player_status":
															handlerQueryPlayerStatus(connection, stanza);
															break;
														case "setmasterserver":
															handlerQuerySetMasterserver(connection, stanza);
															break;
														case "gameroom_sync":
															handlerQueryGameroomSync(connection, stanza);
															break;
														case "broadcast_session_result":
															handlerQueryBroadcastSessionResult(connection, stanza);
															break;
														case "brodcast_session_result":
															handlerQueryBroadcastSessionResult(connection, stanza);
															break;
														case "data":
															handlerQueryData(connection, stanza);
															break;
														case "broadcast_sync":
															handlerQueryBroadcastSync(connection, stanza);
															break;
														case "profile_info_get_status":
															handlerProfileInfoGetStatus(connection, stanza);
															break;
														case "xmpp_kick":
															handlerXmppKick(connection, stanza);
															break;
														case "gameroom_quickplay_backend":
															handlerGameroomQuickplayBackend(connection, stanza);
															break;
														case "gameroom_quickplay_cancel_backend":
															handlerGameroomQuickplayCancelBackend(connection, stanza);
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

		case 'result':
			switch (stanza.name) {
				case "iq":
					switch (stanza.xmlns) {
						case "jabber:client":

							break

					}
					break;

			}
			break;

	}
}

function handlerQueryAccount(connection, stanza) {
	var login = stanza.children[0].children[0].attrs.login;
	var password = stanza.children[0].children[0].attrs.password;

	if (login != connection.username || password != connection.version + "~" + connection.password) {
		var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": stanza.attrs.from, "id": stanza.attrs.id, type: 'result' });
		elementIq.c('query', { xmlns: 'urn:cryonline:k01' }).c(stanza.children[0].children[0].name, stanza.children[0].children[0].attrs);
		elementIq.c('error', { type: 'continue', code: "8", custom_code: "1" }).c('internal-server-error', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas' }).up().c('text', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas', "xml:lang": 'en' }).t('Custom query error');
		connection.send(String(elementIq));
		return;
	}

	var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": stanza.attrs.from, "id": stanza.attrs.id, type: 'result' });
	var elementQuery = elementIq.c('query', { xmlns: 'urn:cryonline:k01' });

	var elementAccount = elementQuery.c("account", { user: connection.username, active_token: connection.active_token, nickname: "", survival_lb_enabled: "0" })
	var elementMasterservers = elementAccount.c("masterservers");


	for (var i = 0; i < global.masterserversArr.length; i++) {

		var masterserverInfo = global.masterserversArr[i].info;

		if (connection.version && connection.version != masterserverInfo.version) {
			continue;
		}

		var elementServer = elementMasterservers.c("server", masterserverInfo);
		var elementLoadStats = elementServer.c("load_stats");
		elementLoadStats.c("load_stat", { type: "quick_play", value: "255" });
		elementLoadStats.c("load_stat", { type: "survival", value: "255" });
		elementLoadStats.c("load_stat", { type: "pve", value: "255" });
	}

	connection.send(String(elementIq));
}

function handlerQueryGetMasterServer(connection, stanza) {
	var rank = Number(stanza.children[0].children[0].attrs.rank);
	var channel = stanza.children[0].children[0].attrs.channel;
	var used_resources = stanza.children[0].children[0].attrs.used_resources;
	var search_type = stanza.children[0].children[0].attrs.search_type;

	var validMasterserversChannel = [];
	var validMasterserversRank = [];
	var validMasterserversAll = [];

	//Построение таблицы уже использованных ресурсов
	var usedResourcesArr = null;

	if (used_resources != null) {
		usedResourcesArr = used_resources.split(";");
	}

	//Поиск каналов подходящих по типу которые ещё не использовались
	var rank_is_nan = Number.isNaN(rank);
	for (var i = 0; i < global.masterserversArr.length; i++) {

		var masterserverInfo = global.masterserversArr[i].info;

		if (connection.version && connection.version != masterserverInfo.version) {
			continue;
		}

		if (usedResourcesArr == null || usedResourcesArr.indexOf(masterserverInfo.resource) == -1) {
			if (masterserverInfo.channel == channel) {
				validMasterserversChannel.push(masterserverInfo.resource);
			} else if (rank_is_nan == false && masterserverInfo.min_rank <= rank && masterserverInfo.max_rank >= rank) {
				validMasterserversRank.push(masterserverInfo.resource);
			} else {
				validMasterserversAll.push(masterserverInfo.resource);
			}
		}

	}

	var validMasterservers = [];
	if (validMasterserversChannel.length > 0) {
		validMasterservers = validMasterserversChannel;
	} else if (validMasterserversRank.length > 0) {
		validMasterservers = validMasterserversRank;
	} else {
		validMasterservers = validMasterserversAll;
	}

	if (validMasterservers.length > 0) {
		var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": stanza.attrs.from, "id": stanza.attrs.id, type: 'result' });
		var elementQuery = elementIq.c('query', { xmlns: 'urn:cryonline:k01' });
		elementQuery.c("get_master_server", { resource: validMasterservers[Math.floor(Math.random() * validMasterservers.length)], load_index: "255" });
		connection.send(String(elementIq));
	} else {
		var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": stanza.attrs.from, "id": stanza.attrs.id, type: 'result' });
		elementIq.c('query', { xmlns: 'urn:cryonline:k01' }).c(stanza.children[0].children[0].name, stanza.children[0].children[0].attrs);
		elementIq.c('error', { type: 'continue', code: "8", custom_code: "1" }).c('internal-server-error', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas' }).up().c('text', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas', "xml:lang": 'en' }).t('Custom query error');
		connection.send(String(elementIq));
	}
}

function handlerQueryGetMasterServers(connection, stanza) {
	var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": stanza.attrs.from, "id": stanza.attrs.id, type: 'result' });
	var elementQuery = elementIq.c('query', { xmlns: 'urn:cryonline:k01' });

	var elementMasterservers = elementQuery.c("get_master_servers").c("masterservers");


	for (var i = 0; i < global.masterserversArr.length; i++) {

		var masterserverInfo = global.masterserversArr[i].info;

		if (connection.version && connection.version != masterserverInfo.version) {
			continue;
		}

		var elementServer = elementMasterservers.c("server", masterserverInfo);
		var elementLoadStats = elementServer.c("load_stats");
		elementLoadStats.c("load_stat", { type: "quick_play", value: "255" });
		elementLoadStats.c("load_stat", { type: "survival", value: "255" });
		elementLoadStats.c("load_stat", { type: "pve", value: "255" });
	}

	connection.send(String(elementIq));
}

function handlerQueryCreateProfile(connection, stanza) {
	stanza.attrs.to = "masterserver@" + connection.host + "/" + stanza.children[0].children[0].attrs.resource;
	delete stanza.children[0].children[0].attrs.resource;
	moduleStanza.module(connection, stanza);
}

function handlerQueryJoinChannel(connection, stanza) {
	stanza.attrs.to = "masterserver@" + connection.host + "/" + stanza.children[0].children[0].attrs.resource;
	delete stanza.children[0].children[0].attrs.resource;
	moduleStanza.module(connection, stanza);
}

function handlerQuerySwitchChannel(connection, stanza) {
	stanza.attrs.to = "masterserver@" + connection.host + "/" + stanza.children[0].children[0].attrs.resource;
	delete stanza.children[0].children[0].attrs.resource;
	moduleStanza.module(connection, stanza);
}

function handlerQueryPlayerStatus(connection, stanza) {

	if (stanza.children[0].children[0].attrs.to) {
		stanza.attrs.to = "masterserver@" + connection.host + "/" + stanza.children[0].children[0].attrs.to;
		delete stanza.children[0].children[0].attrs.to;
		moduleStanza.module(connection, stanza);
	} else {
		for (var jid in global.connectionsOnline) {

			var connectionOnline = global.connectionsOnline[jid];

			if (connectionOnline.isOnline == true && connectionOnline.username == "masterserver") {
				stanza.attrs.to = jid;
				moduleStanza.module(connection, stanza);
			}
		}
	}

	var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": stanza.attrs.from, "id": stanza.attrs.id, type: 'result' });
	elementIq.c('query', { xmlns: 'urn:cryonline:k01' });
	connection.send(String(elementIq));
}

var masterserverDeleteTimeout = 60000;
function handlerQuerySetMasterserver(connection, stanza) {
	var username = stanza.attrs.from.split("@")[0];
	if (username == "masterserver") {
		var msAttrs = stanza.children[0].children[0].attrs;
		var msInfoJson = { resource: msAttrs.resource, server_id: Number(msAttrs.server_id), channel: msAttrs.channel, rank_group: msAttrs.rank_group, load: Number(msAttrs.load), online: Number(msAttrs.online), min_rank: Number(msAttrs.min_rank), max_rank: Number(msAttrs.max_rank), bootstrap: '', version: msAttrs.version };

		var masterserverIndex = global.masterserversArr.findIndex(function (i) { return i.jid == stanza.attrs.from });
		if (masterserverIndex != -1) {
			var masterserverInfo = global.masterserversArr[masterserverIndex];
			clearTimeout(masterserverInfo.timerDelete);
			masterserverInfo.timerDelete = setTimeout(deleteChannel, masterserverDeleteTimeout, stanza.attrs.from);

			global.masterserversArr[masterserverIndex].info = msInfoJson;
		} else {
			global.masterserversArr.push({ jid: stanza.attrs.from, info: msInfoJson, timerDelete: setTimeout(deleteChannel, masterserverDeleteTimeout, stanza.attrs.from) });
			console.log("[ChannelsList]:Channel '" + stanza.attrs.from + "' Added");
		}
	}
}

function handlerQueryGameroomSync(connection, stanza) {

	var username = stanza.attrs.from.split("@")[0];

	if (username == "masterserver") {

		var arrBcastReceivers = stanza.children[0].children[0].attrs.bcast_receivers.split(",");
		delete stanza.children[0].children[0].attrs.bcast_receivers;

		stanza.attrs.from = stanza.attrs.to;

		for (var i = 0; i < arrBcastReceivers.length; i++) {
			var bcastJid = arrBcastReceivers[i];
			var userConnection = global.connectionsOnline[bcastJid];
			if (userConnection) {
				stanza.attrs.to = bcastJid;
				userConnection.send(String(stanza));
			}
		}
	}
}


function handlerQueryBroadcastSessionResult(connection, stanza) {

	var username = stanza.attrs.from.split("@")[0];

	if (username == "masterserver") {

		var arrBcastReceivers = stanza.children[0].children[0].attrs.bcast_receivers.split(",");
		delete stanza.children[0].children[0].attrs.bcast_receivers;

		stanza.attrs.from = stanza.attrs.to;

		for (var i = 0; i < arrBcastReceivers.length; i++) {
			var bcastJid = arrBcastReceivers[i];
			var userConnection = global.connectionsOnline[bcastJid];
			if (userConnection) {
				stanza.attrs.to = bcastJid;
				userConnection.send(String(stanza));
			}
		}
	}
}

function handlerQueryData(connection, stanza) {
	switch (stanza.children[0].children[0].attrs.query_name) {
		case "gameroom_sync":
			handlerQueryGameroomSync(connection, stanza);
			break;
		case "broadcast_session_result":
			handlerQueryBroadcastSessionResult(connection, stanza);
			break;
		case "brodcast_session_result":
			handlerQueryBroadcastSessionResult(connection, stanza);
			break;
	}
}

function handlerQueryBroadcastSync(connection, stanza) {

	var username = stanza.attrs.from.split("@")[0];

	if (username == "masterserver") {

		stanza.attrs.from = stanza.attrs.to;

		for (var i = 0; i < global.masterserversArr.length; i++) {
			var masterserverJid = global.masterserversArr[i].jid;
			var masterserverConnection = global.connectionsOnline[masterserverJid];

			if (masterserverConnection) {
				stanza.attrs.to = masterserverJid;
				masterserverConnection.send(String(stanza));
			}
		}
	}
}

function handlerProfileInfoGetStatus(connection, stanza) {
	var masterserversJidsArr = [];

	for (var i = 0; i < global.masterserversArr.length; i++) {

		if (connection.version && connection.version != global.masterserversArr[i].info.version) {
			continue;
		}

		masterserversJidsArr.push(global.masterserversArr[i].jid);
	}

	if (masterserversJidsArr.length > 0) {
		stanza.attrs.to = masterserversJidsArr[Math.floor(Math.random() * masterserversJidsArr.length)];
		moduleStanza.module(connection, stanza);
	}
}

function handlerXmppKick(connection, stanza) {
	if (connection.isAdmin == true) {
		for (var jid in global.connectionsOnline) {
			var connection = global.connectionsOnline[jid];
			if (connection.isOnline == true && connection.isAuthorized == true && connection.username == stanza.children[0].children[0].attrs.username) {
				connection.sendEnd("");
			}
		}
	}
}

function handlerGameroomQuickplayBackend(connection, stanza) {

	var room_type = stanza.children[0].children[0].attrs.room_type;
	var game_mode = stanza.children[0].children[0].attrs.game_mode;
	var mission_id = stanza.children[0].children[0].attrs.mission_id;
	var mission_hash = stanza.children[0].children[0].attrs.mission_hash;
	var content_hash = stanza.children[0].children[0].attrs.content_hash;
	var timestamp = stanza.children[0].children[0].attrs.timestamp;
	var uid = stanza.children[0].children[0].attrs.uid;
	var username = stanza.children[0].children[0].attrs.username;

	var quickplayObject = { uid: uid, room_type: room_type, game_mode: game_mode, mission_id: mission_id, username: username };

	var connectionClient = global.connectionsOnline[quickplayObject.username + "@" + connection.host + "/GameClient"];

	if (!connectionClient) {
		return;
	}

	var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": connectionClient.jid, "id": componentQueryId, type: 'get' });
	var elementQuery = elementIq.c('query', { xmlns: 'urn:cryonline:k01' });
	elementQuery.c('gameroom_quickplay_started', { mission_hash: mission_hash, content_hash: content_hash, time_to_maps_reset_notification: "120", response_time: "0", timestamp: timestamp, uid: quickplayObject.uid });
	connectionClient.send(String(elementIq));
	componentQueryId++;

	global.quickplayObjectsArr.push(quickplayObject);

	console.log("[Quickplay] Start '" + quickplayObject.username + "'");
}

function handlerGameroomQuickplayCancelBackend(connection, stanza) {

	var username = stanza.children[0].children[0].attrs.username;

	var quickplayRoomIndex = -1;

	for (var i = 0; i < global.quickplayObjectsArr.length; i++) {
		if (global.quickplayObjectsArr[i].username == username) {
			quickplayRoomIndex = i;
			break;
		}
	}

	var quickplayObject = global.quickplayObjectsArr[quickplayRoomIndex];

	if (!quickplayObject) {
		return;
	}

	var connectionClient = global.connectionsOnline[quickplayObject.username + "@" + connection.host + "/GameClient"];

	if (!connectionClient) {
		return;
	}

	var elementIq = new Element('iq', { "from": stanza.attrs.to, "to": connectionClient.jid, "id": componentQueryId, type: 'get' });
	var elementQuery = elementIq.c('query', { xmlns: 'urn:cryonline:k01' });
	elementQuery.c('gameroom_quickplay_canceled', { uid: quickplayObject.uid });
	connectionClient.send(String(elementIq));
	componentQueryId++;

	global.quickplayObjectsArr.splice(quickplayRoomIndex, 1);

	console.log("[Quickplay] Cancel '" + quickplayObject.username + "'");
}

function deleteChannel(jid) {
	var masterserverIndex = global.masterserversArr.findIndex(function (i) { return i.jid == jid });
	if (masterserverIndex != -1) {
		global.masterserversArr.splice(masterserverIndex, 1);
	}
	console.log("[ChannelsList]:Channel '" + jid + "' Deleted");
}