var ltxElement = require('ltx').Element

var scriptClan = require('../scripts/clan.js')

var RegExpNameRU = new RegExp("[^-.0-9_А-ЯЁа-яё]");
var RegExpNameEN = new RegExp("[^-.0-9_A-Za-z]");

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][ClanCreate]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "12" });
		return;
	}

	var clan_name = stanza.children[0].children[0].attrs.clan_name;
	var description = base64ToString(stanza.children[0].children[0].attrs.description);

	if (!clan_name || clan_name.length < 4 || clan_name.length > 16 || (RegExpNameRU.test(clan_name) && RegExpNameEN.test(clan_name))) {
		//console.log("[" + stanza.attrs.from + "][ClanCreate]:Incorrect name");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	//Проверка на мат
	//---

	if (description.length > 2000) {
		//console.log("[" + stanza.attrs.from + "][ClanCreate]:Incorrect description");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "8" });
		return;
	}

	global.db.warface.profiles.findOne({ username: profileObject.username }, { projection: { "clan_name": 1 } }, function (errProfile, resultProfile) {

		if (errProfile) {
			//console.log("[" + stanza.attrs.from + "][ClanCreate]:Failed to getting data from the database");
			global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
			return;
		}

		if (!resultProfile) {
			//console.log("[" + stanza.attrs.from + "][ClanCreate]:Profile not found");
			global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
			return;
		}

		if (resultProfile.clan_name) {
			//console.log("[" + stanza.attrs.from + "][ClanCreate]:User already clan member");
			global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
			return;
		}

		//if (!resultProfile.items) {
		//	console.log("[" + stanza.attrs.from + "][ClanCreate]:User is not have 'clan_creation_item_01' ");
		//	global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
		//	return;
		//}

		var currentTime = Math.floor(Date.now() / 1000);

		сreateClan({
			name: clan_name,
			description: stringToBase64(description),
			creation_date: currentTime,
			leaderboard_position: 0

		}, global.db.warface.clans, (errCreate, resultCreate) => {

			if (errCreate) {

				var errKey = null;

				if (errCreate.errmsg) {
					errKey = errCreate.errmsg.split("index: ")[1].split(" dup")[0];
				}

				if (errKey == "warface.clans.$_name_" || errKey == "_name_") {
					//console.log("[" + stanza.attrs.from + "][ClanCreate]:Clan name is duplicate");
					global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
				} else {
					//console.log("[" + stanza.attrs.from + "][ClanCreate]:Failed to create, unknown error");
					global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "11" });
				}

				return;
			}

			global.db.warface.profiles.findOneAndUpdate({ _id: resultProfile._id, clan_name: "" }, { $set: { clan_name: clan_name, clan_points: 0, clan_role: 1, invite_date: currentTime }, $pull: { items: { name: "clan_creation_item_01" } } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

				if (errUpdate || !resultUpdate.lastErrorObject.updatedExisting) {
					global.db.warface.clans.remove({ _id: resultCreate.value._id }, function (errRemove, resultRemove) {

						if (errUpdate) {
							//console.log("[" + stanza.attrs.from + "][ClanCreate]:Failed to save to the database");
							global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "12" });
							return;
						}


						if (!resultUpdate.lastErrorObject.updatedExisting) {
							//console.log("[" + stanza.attrs.from + "][ClanCreate]:User already clan member or not found, state 2");
							global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
							return;
						}

					});
					return;
				}

				scriptClan.getClanInfo(clan_name, function (elementClanInfo) {

					global.xmppClient.response(stanza, new ltxElement("clan_create", {description:description, clan_name:clan_name}));

					if (elementClanInfo) {
						global.xmppClient.request(stanza.attrs.from, elementClanInfo)
					}

					/*
					if (!elementClanInfo) {
						//console.log("[" + stanza.attrs.from + "][ClanCreate]:Failed to get clan");
					}

					//console.log("[" + stanza.attrs.from + "][ClanCreate]:Ok");
					profileObject.clan_name = clan_name;

					var roomObject = profileObject.room_object;

					if (roomObject) {
						var playerObject = profileObject.room_player_object;
						playerObject.clanName = clan_name;
						roomObject.core.revision++;
					}
					elementClanInfo.name = "clan_create";
					global.xmppClient.response(stanza, elementClanInfo);
					*/
				});

			});
		});
	});
}

function сreateClan(doc, datbase_cur, callback) {
	datbase_cur.find({}).sort({ _id: -1 }).limit(1).toArray(function (err_a, results) {

		if (results != null) {
			var new_id = 1;

			if (results[0] != null) {
				new_id = results[0]._id + 1;
			}

			doc._id = new_id;

			datbase_cur.insertOne(doc, function (err, res) {

				var errKey = null;
				if (err != null && err.errmsg != null) {
					errKey = err.errmsg.split("index: ")[1].split(" dup")[0];
				}

				if (errKey == null || (errKey != "warface.clans.$_id_" && errKey != "_id_")) {
					callback(err, res);
				} else {
					setTimeout(сreateClan, (Math.floor(Math.random() * (10000 - 1000)) + 1000), doc, datbase_cur, callback);
				}

			});
		} else {
			callback(err_a, null);
		}

	})
}

function base64ToString(b64data) {
	try {
		return (typeof Buffer.from === "function" ? Buffer.from(b64data, 'base64') : new Buffer(b64data, 'base64')).toString('utf-8');
	} catch (err) {
		return "";
	}
}

function stringToBase64(stringData) {
	try {
		return (typeof Buffer.from === "function" ? Buffer.from(stringData, 'utf-8') : new Buffer(stringData, 'utf-8')).toString('base64');
	} catch (err) {
		return "";
	}
}