var ltxElement = require('ltx').Element

var scriptTools = require('../scripts/tools.js')
var scriptClan = require('../scripts/clan.js')
var scriptProfile = require('../scripts/profile.js')

var allowedRegionIds = ["moscow", "petersburg", "krasnodar", "novosibirsk", "ekaterinburg", "vladivostok", "khabarovsk"];

function kickByHwBan(username) {
	console.log("[" + username + "][JoinChannel]:Kicked By HwBan");
	global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("xmpp_kick", { username: username }));
}

function profileAddAuthEvent(id, username, hw_id) {
	global.db.warface.profiles.findOneAndUpdate({ _id: id }, { "$push": { authorization_events: [hw_id, Math.round(new Date().getTime() / 1000.0)] } }, { projection: { "_id": 1 } }, function (err, dbUpdate) {
		//console.log("["+id+"][JoinChannel]:ProfileAddAuthEvent OK");
		global.db.warface.hwban.findOne({ _id: hw_id }, function (errHwBan, resultHwban) {
			if (resultHwban) {
				setTimeout(kickByHwBan, 30000, username);
			}
		});
	});
}

exports.module = function (stanza) {
	console.time("join_channel_full");

	var version = stanza.children[0].children[0].attrs.version;
	var token = stanza.children[0].children[0].attrs.token;
	var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);
	var user_id = stanza.children[0].children[0].attrs.user_id;
	var region_id = stanza.children[0].children[0].attrs.region_id;
	var resource = stanza.children[0].children[0].attrs.resource;
	var hw_id = Number(stanza.children[0].children[0].attrs.hw_id);
	var build_type = stanza.children[0].children[0].attrs.build_type;

	var username = stanza.attrs.from.split("@")[0];

	var queryName = stanza.children[0].children[0].name;

	if ((queryName == "join_channel" || queryName == "create_profile") && (Number.isNaN(hw_id) || !Number.isSafeInteger(hw_id) || hw_id < 0 || hw_id > 2147483647)) {
		//console.log("["+stanza.attrs.from+"][JoinChannel]:Uncorrect Hwid");
		//global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "13" });
		//return;
		hw_id = 0;
	}

	//Проверка версии игры
	if (version && global.startupParams.ver && version != global.startupParams.ver) {
		//console.log("[" + stanza.attrs.from + "][JoinChannel]:Version mismatch");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	//Проверка совпадения аттрибута user_id с реальным username
	if (user_id != username && user_id != "0") {
		//console.log("[" + stanza.attrs.from + "][JoinChannel]:UserId mismatch");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "9" });
		return;
	}

	//Проверка токена
	//if(token != connection.active_token){
	//	console.log("["+stanza.attrs.from+"][JoinChannel]:Active token mismatch");
	//	global.xmppClient.responseError(stanza, {type:'continue', code:"8", custom_code:"10"});
	//	return;
	//}

	global.db.warface.profiles.findOne({ username: username }, function (errProfile, resultProfile) {
		//console.time("t");
		//Проверка на ошибку выполнения запроса в бд
		if (errProfile) {
			//console.log("[" + stanza.attrs.from + "][JoinChannel]:Failed to getting data from the database");
			global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "11" });
			return;
		}

		//Проверка на существование профиля
		if (!resultProfile) {
			//console.log("[" + stanza.attrs.from + "][JoinChannel]:Profile not found");
			global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
			return;
		}

		//Проверка на совпадение аттрибута profile_id с реальным id профиля
		if ((Number.isNaN(profile_id) || profile_id != resultProfile._id) && queryName != "create_profile") {
			//console.log("[" + stanza.attrs.from + "][JoinChannel]:ProfileId mismatch");
			global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "12" });
			return;
		}

		//Проверка на бан аккаунта

		//Проверка на количество опыта
		if (scriptTools.getLevelByExp(resultProfile.experience) < Number(global.startupParams.min_rank) || scriptTools.getLevelByExp(resultProfile.experience) > Number(global.startupParams.max_rank)) {
			//console.log("[" + stanza.attrs.from + "][JoinChannel]:Rank mismatch");
			global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "5" });
			return;
		}

		//Проверка находится ли в данный момент пользователь на этом канале
		if (global.users.jid[stanza.attrs.from]) {
			//console.log("[" + stanza.attrs.from + "][JoinChannel]:Already logged in");
			global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "8" });
			return;
		}

		if (queryName == "join_channel" || queryName == "create_profile") {
			profileAddAuthEvent(resultProfile._id, resultProfile.username, hw_id);
		}

		if (allowedRegionIds.indexOf(region_id) == -1) {
			region_id = "petersburg";
		}

		var profileObject = {
			"_id": resultProfile._id,
			"username": resultProfile.username,
			"gender": resultProfile.gender,
			"height": resultProfile.height,
			"fatness": resultProfile.fatness,
			"game_money": resultProfile.game_money,
			"cry_money": resultProfile.cry_money,
			"crown_money": resultProfile.crown_money,
			"experience": resultProfile.experience,
			"current_class": resultProfile.current_class,
			"banner_badge": resultProfile.banner_badge,
			"banner_mark": resultProfile.banner_mark,
			"banner_stripe": resultProfile.banner_stripe,
			"status": resultProfile.status,
			"location": resultProfile.location,
			"nick": resultProfile.nick,
			"clan_name": resultProfile.clan_name,
			"head": resultProfile.head,
			"items": resultProfile.items,
			"expired_items": resultProfile.expired_items,
			"missions_unlocked": resultProfile.missions_unlocked,
			"tutorial_passed": resultProfile.tutorial_passed,
			"tutorials_passed": resultProfile.tutorials_passed,
			"classes_unlocked": resultProfile.classes_unlocked,
			"persistent_settings": resultProfile.persistent_settings,
			"achievements": resultProfile.achievements,
			"is_starting_achievements_issued": resultProfile.is_starting_achievements_issued,
			"stats": resultProfile.stats,
			"contracts": resultProfile.contracts,
			"profile_performance": resultProfile.profile_performance,
			"wpn_usage": resultProfile.wpn_usage,
			"login_bonus": resultProfile.login_bonus,
			"win_limits": resultProfile.win_limits,
			"pvp_rating_points": resultProfile.pvp_rating_points,
			"room_object": null,
			"room_player_object": null,
			"region_id": region_id
		}

		//resultProfile.room_id = null;
		global.users.jid[stanza.attrs.from] = profileObject;
		global.users._id[profileObject._id] = profileObject;

		var arrElementAddFriendRequest = [];

		var elementJoinChannel = new ltxElement(queryName, (queryName == "create_profile") ? { profile_id: resultProfile._id } : {});
		var elementCharacter = elementJoinChannel.c("character", { nick: resultProfile.nick, gender: resultProfile.gender, height: resultProfile.height, fatness: resultProfile.fatness, head: resultProfile.head, current_class: resultProfile.current_class, experience: resultProfile.experience, banner_badge: resultProfile.banner_badge, banner_mark: resultProfile.banner_mark, banner_stripe: resultProfile.banner_stripe, game_money: resultProfile.game_money, cry_money: resultProfile.cry_money, crown_money: resultProfile.crown_money, mission_passed: (0 + (resultProfile.missions_unlocked.indexOf("easymission") != -1 ? 64 : 0) + (resultProfile.missions_unlocked.indexOf("normalmission") != -1 ? 128 : 0) + (resultProfile.missions_unlocked.indexOf("hardmission") != -1 ? 256 : 0)), pvp_rating: "0", pvp_rating_points: resultProfile.pvp_rating_points });

		if (queryName == "join_channel" || queryName == "create_profile") {

			scriptProfile.getExpiredItems(profileObject);

			for (var i = 0; i < profileObject.items.length; i++) {
				//elementCharacter.c("item", profileObject.items[i]);
				var itemInfo = profileObject.items[i];
				elementCharacter.c("item", { id: itemInfo.id, name: itemInfo.name, attached_to: itemInfo.attached_to, config: itemInfo.config, slot: itemInfo.slot, equipped: itemInfo.equipped, default: itemInfo.default, permanent: itemInfo.permanent, expired_confirmed: itemInfo.expired_confirmed, buy_time_utc: itemInfo.buy_time_utc, expiration_time_utc: itemInfo.expiration_time_utc, seconds_left: itemInfo.seconds_left, hours_left: Math.round(itemInfo.seconds_left / 3600), total_durability_points: itemInfo.total_durability_points, durability_points: itemInfo.durability_points, quantity: itemInfo.quantity });
			}

			for (var i = 0; i < profileObject.expired_items.length; i++) {
				elementCharacter.c("expired_item", profileObject.expired_items[i]);
			}
		}

		//Открытые предеметы
		//elementCharacter.c("unlocked_item", {id:"12345"});

		//TODO
		if (queryName == "join_channel" || queryName == "create_profile") {
			var elementSponsorInfo = elementCharacter.c("sponsor_info");
			elementSponsorInfo.c("sponsor", { sponsor_id: "0", sponsor_points: "676969", next_unlock_item: "" });
			elementSponsorInfo.c("sponsor", { sponsor_id: "1", sponsor_points: "578006", next_unlock_item: "" });
			elementSponsorInfo.c("sponsor", { sponsor_id: "2", sponsor_points: "299845", next_unlock_item: "" });
		}

		var elementChatChannels = elementCharacter.c("chat_channels");
		elementChatChannels.c("chat", { channel: "0", channel_id: "global." + global.startupParams.resource, service_id: "conference." + global.config.masterserver.domain });
		if (resultProfile.clan_name) {
			elementChatChannels.c("chat", { channel: "3", channel_id: "clan." + scriptTools.getHexStringFromString(resultProfile.clan_name), service_id: "conference." + global.config.masterserver.domain });
		}


		var profileTutorialUnloked = 1 + (resultProfile.experience >= 120 ? 2 : 0) + (resultProfile.experience >= 2900 ? 4 : 0);

		elementCharacter.c("profile_progression_state", { profile_id: resultProfile._id, mission_unlocked: "none," + resultProfile.missions_unlocked.join(",") + ",all", tutorial_unlocked: profileTutorialUnloked, tutorial_passed: scriptTools.getFlagByNumericArray(resultProfile.tutorials_passed), class_unlocked: scriptTools.getFlagByNumericArray(resultProfile.classes_unlocked) });

		var countRewards = global.resources.objectCustomRules.consecutive_login_bonus.length;

		if (countRewards) {

			var previousDay = profileObject.login_bonus.prvday;
			var currentDay = Math.floor((new Date().getTime() + 10800000) / 86400000);

			if (currentDay != previousDay) {

				var previousReward = profileObject.login_bonus.reward;
				var currentReward = previousReward + 1;

				if (currentReward >= countRewards || currentDay - previousDay > 1) {
					//console.log("[JoinChannel]:LoginBonus out of rewards or skipped day");
					currentReward = 0;
				}

				profileObject.login_bonus.prvday = currentDay;
				profileObject.login_bonus.reward = currentReward;

				scriptProfile.giveSpecialReward(profileObject, global.resources.objectCustomRules.consecutive_login_bonus[currentReward], { previous_streak: 0, previous_reward: previousReward, current_streak: 0, current_reward: currentReward });
			}
		}

		if (queryName == "join_channel" || queryName == "create_profile") {
			elementCharacter.c("login_bonus", { current_streak: 0, current_reward: profileObject.login_bonus.reward });
		}

		for (var i = 0; i < resultProfile.notifications.length; i++) {
			var notificationInfo = resultProfile.notifications[i];
			var notificationObjectInfo = scriptProfile.notificationsObject[notificationInfo.type];

			if (!notificationObjectInfo) {
				//console.log("["+stanza.attrs.from+"][JoinChannel]:Notification id: '"+notificationInfo.id+"', type: '"+notificationInfo.type+"' in not found in notificationsObject");
				continue;
			}

			if (!notificationObjectInfo.validateParams(notificationInfo.params)) {
				//console.log("["+stanza.attrs.from+"][JoinChannel]:Notification id: '"+notificationInfo.id+"', failed to validate params");
				continue;
			}

			var elementNotif = elementCharacter.c("notif", { id: notificationInfo.id, type: notificationInfo.type, confirmation: (notificationInfo.id ? 1 : 0), from_jid: global.config.masterserver.username + "@" + global.config.masterserver.domain + "/" + global.startupParams.resource, message: "" });
			var elementNotifBody = notificationObjectInfo.parseParams(notificationInfo.params);
			if (notificationInfo.login_bonus) {
				elementNotifBody.c("consecutive_login_bonus", notificationInfo.login_bonus);
			}
			elementNotif.children.push(elementNotifBody);

			if (notificationInfo.type == 64) {
				var elementAddFriendRequest = new ltxElement("add_friend_request");
				elementAddFriendRequest.c("friend", { jid: notificationInfo.params.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": notificationInfo.params.initiator, "status": 2, "experience": 0, "location": "" });
				arrElementAddFriendRequest.push([elementAddFriendRequest, notificationInfo.id]);
			}

			if (notificationInfo.type == 128) {
				var elementAddFriendResult = new ltxElement("add_friend_result", { result: notificationInfo.params.result });
				elementAddFriendResult.c("friend", { jid: notificationInfo.params.username + "@" + global.config.masterserver.domain + "/GameClient", "nickname": notificationInfo.params.nickname, "status": notificationInfo.params.status, "experience": notificationInfo.params.experience, "location": "" });
				arrElementAddFriendRequest.push([elementAddFriendResult, notificationInfo.id]);
			}

			if (notificationInfo.type == 16) {
				var elementClanInviteRequest = new ltxElement("clan_invite_request", { clan_name: notificationInfo.params.clan_name, nickname: notificationInfo.params.initiator });
				arrElementAddFriendRequest.push([elementClanInviteRequest, notificationInfo.id]);
			}

			if (notificationInfo.type == 32) {
				var elementClanInviteResult = new ltxElement("clan_invite_result", { result: notificationInfo.params.result, nickname: notificationInfo.params.nickname });
				arrElementAddFriendRequest.push([elementClanInviteResult, notificationInfo.id]);
			}
		}

		if (queryName == "join_channel" || queryName == "create_profile") {
			var elementAbuseManagerConfig = elementCharacter.c("abuse_manager_config");
			var elementReportTypes = elementAbuseManagerConfig.c("report_types");

			for (var i = 0; i < global.config.abuse_manager_config.length; i++) {
				var reportType = global.config.abuse_manager_config[i];
				elementReportTypes.c("report_type", { message: "@ui_abuse_" + reportType, name: reportType });
			}
		}

		var elementVariables = elementCharacter.c("variables");
		for (varKey in global.config.variables_client) {
			elementVariables.c("item", { key: varKey, value: global.config.variables_client[varKey] });
		}

		if (queryName == "join_channel" || queryName == "create_profile") {
			global.db.warface.profiles.find({ _id: { $in: resultProfile.friends } }, { projection: { "username": 1, "experience": 1, "status": 1, "location": 1, "nick": 1 } }).toArray(function (errFriends, resultFriends) {
				scriptClan.getClanInfo(resultProfile.clan_name, function (elementClanInfo) {
					var elementFriendList = new ltxElement("friend_list");

					if (!errFriends && resultFriends) {
						for (i = 0; i < resultFriends.length; i++) {
							var friendInfo = resultFriends[i];
							elementFriendList.c("friend", { jid: (friendInfo.status != 2 ? (friendInfo.username + "@" + global.config.masterserver.domain + "/GameClient") : ""), profile_id: friendInfo._id, nickname: friendInfo.nick, status: friendInfo.status, experience: friendInfo.experience, location: friendInfo.location });
						}
					} else {
						//console.log("[" + stanza.attrs.from + "][JoinChannel]:Failed to get friends");
					}

					global.xmppClient.response(stanza, elementJoinChannel);

					global.xmppClient.request(stanza.attrs.from, elementFriendList);

					if (elementClanInfo) {
						global.xmppClient.request(stanza.attrs.from, elementClanInfo)
					}

					for (var i = 0; i < arrElementAddFriendRequest.length; i++) {
						global.xmppClient.request(stanza.attrs.from, arrElementAddFriendRequest[i][0], arrElementAddFriendRequest[i][1])
					}
					
					console.timeEnd("join_channel_full");
				});

			});
		} else {
			global.xmppClient.response(stanza, elementJoinChannel);
			console.timeEnd("join_channel_full");
		}
	});
}