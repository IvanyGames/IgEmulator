var ltxElement = require('ltx').Element
var ltx = require('ltx')
var scriptGameroom = require('./gameroom.js');
var scriptTools = require('./tools.js');

exports.notificationsObject = {
	"4": {
		validateParams: function (params) {
			return (typeof params.achievement_id === "number" && params.achievement_id > -1 && typeof params.progress === "number" && params.progress > -1 && typeof params.completion_time === "number" && params.completion_time > -1);
		},
		parseParams: function (params) {
			return new ltxElement("achievement", { achievement_id: params.achievement_id, progress: params.progress, completion_time: params.completion_time });
		},
		getInfo: function () {
			return { confirmation: false };
		}
	},
	"8": {
		validateParams: function (params) {
			return (typeof params.data === "string");
		},
		parseParams: function (params) {
			return new ltxElement("message", { data: params.data });
		},
		getInfo: function () {
			return { confirmation: false };
		}
	},
	"16": {
		validateParams: function (params) {
			return (typeof params.username === "string" && typeof params.initiator === "string" && typeof params.clan_name === "string" && typeof params.clan_id === "string");
		},
		parseParams: function (params) {
			return new ltxElement("invitation", { clan_name: params.clan_name, clan_id: params.clan_id, initiator: params.initiator });
		},
		getInfo: function () {
			return { confirmation: true };
		}
	},
	"32": {
		validateParams: function (params) {
			return (typeof params.username === "string" && typeof params.profile_id === "number" && params.profile_id > -1 && typeof params.nickname === "string" && typeof params.status === "number" && params.status > -1 && typeof params.location === "string" && typeof params.experience === "number" && params.experience > -1 && typeof params.result === "number" && params.result > -1);
		},
		parseParams: function (params) {
			return new ltxElement("invite_result", { profile_id: params.profile_id, jid: params.username + "@" + global.config.masterserver.domain + "/GameClient", nickname: params.nickname, status: params.status, location: params.location, experience: params.experience, result: params.result });
		},
		getInfo: function () {
			return { confirmation: false };
		}
	},
	"64": {
		validateParams: function (params) {
			return (typeof params.username === "string" && typeof params.initiator === "string");
		},
		parseParams: function (params) {
			return new ltxElement("invitation", { clan_name: "", clan_id: "", initiator: params.initiator });
		},
		getInfo: function () {
			return { confirmation: true };
		}
	},
	"128": {
		validateParams: function (params) {
			return (typeof params.username === "string" && typeof params.profile_id === "number" && params.profile_id > -1 && typeof params.nickname === "string" && typeof params.status === "number" && params.status > -1 && typeof params.location === "string" && typeof params.experience === "number" && params.experience > -1 && typeof params.result === "number" && params.result > -1);
		},
		parseParams: function (params) {
			return new ltxElement("invite_result", { profile_id: params.profile_id, jid: params.username + "@" + global.config.masterserver.domain + "/GameClient", nickname: params.nickname, status: params.status, location: params.location, experience: params.experience, result: params.result });
		},
		getInfo: function () {
			return { confirmation: false };
		}
	},
	"256": {
		validateParams: function (params) {
			return (typeof params.name === "string" && (params.offer_type == "Permanent" || ((params.offer_type == "Durability" || params.offer_type == "Expiration") && typeof params.extended_time == "number" && params.extended_time > -1) || (params.offer_type == "Consumable" && typeof params.consumables_count == "number" && params.consumables_count > -1)));
		},
		parseParams: function (params) {
			return new ltxElement("give_item", { name: params.name, offer_type: params.offer_type, extended_time: params.extended_time, consumables_count: params.consumables_count });
		},
		getInfo: function () {
			return { confirmation: true };
		}
	},
	"512": {
		validateParams: function (params) {
			return 1;
		},
		parseParams: function (params) {
			return new ltxElement("announcement", { id: params.id, message: params.message, server: params.server, channel: params.channel, frequency: params.frequency, repeat_time: params.repeat_time, place: params.place });
		},
		getInfo: function () {
			return { confirmation: false };
		}
	},
	"2048": {
		validateParams: function (params) {
			return (typeof params.currency === "string" && typeof params.type === "number" && params.type > -1 && typeof params.amount === "number" && params.amount > -1);
		},
		parseParams: function (params) {
			return new ltxElement("give_money", { currency: params.currency, type: params.type, amount: params.amount });
		},
		getInfo: function () {
			return { confirmation: true };
		}
	},
	"8192": {
		validateParams: function (params) {
			return (typeof params.name === "string" && typeof params.elementPurchasedItemB64 === "string");
		},
		parseParams: function (params) {

			var elementRandomBox = new ltxElement("give_random_box", { name: params.name });

			try {
				var elementPurchasedItem = ltx.parse(Buffer.from(params.elementPurchasedItemB64, 'base64').toString('utf8'));
				elementRandomBox.children.push(elementPurchasedItem);
			} catch (err) {
				console.log("[Profile][notificationsObject]:Failed to parse elementPurchasedItemB64");
			}

			return elementRandomBox;
		},
		getInfo: function () {
			return { confirmation: true };
		}
	},
	"131072": {
		validateParams: function (params) {
			return (typeof params.old_rank === "number" && params.old_rank > -1 && typeof params.new_rank === "number" && params.new_rank > -1);
		},
		parseParams: function (params) {
			return new ltxElement("new_rank_reached", { old_rank: params.old_rank, new_rank: params.new_rank });
		},
		getInfo: function () {
			return { confirmation: false };
		}
	},
	"262144": {
		validateParams: function (params) {
			return (typeof params.data === "string");
		},
		parseParams: function (params) {
			return new ltxElement("message", { data: params.data });
		},
		getInfo: function () {
			return { confirmation: true };
		}
	}
}

exports.giveNotifications = function (username, notifications, sync, callBack) {

	var notifsCountToAllocate = 0;
	for (var i = 0; i < notifications.length; i++) {
		var notificationInfo = notifications[i];

		var notificationObjectInfo = exports.notificationsObject[notificationInfo.type];
		if (!notificationObjectInfo) {
			console.log("[Profile]:giveNotifications, username '" + username + "', failed to find notification type '" + notificationInfo.type + "' in notificationsObject");
			callBack(false);
			return;
		}

		if (!notificationObjectInfo.validateParams(notificationInfo.params)) {
			console.log("[Profile]:giveNotifications, username '" + username + "', failed to validate params of notification type '" + notificationInfo.type + "'");
			console.log(notificationInfo.params);
			callBack(false);
			return;
		}

		//login_bonus validation

		var notificationInfoInObj = notificationObjectInfo.getInfo();

		notificationInfo.id = notificationInfoInObj.confirmation;

		if (notificationInfo.id) {
			notifsCountToAllocate++;
		}
	}

	if (notifsCountToAllocate) {
		global.db.warface.profiles.findOneAndUpdate({ username: username }, { $inc: { "last_notification_id": notifsCountToAllocate } }, { projection: { "last_notification_id": 1 }, returnOriginal: false, returnNewDocument: true, returnDocument: "after" }, function (errId, resultId) {
			if (errId) {
				//console.log("[Profile]:giveNotifications, username '" + username + "', failed execute increase query to database");
				callBack(false);
				return;
			}

			if (!resultId.lastErrorObject.updatedExisting) {
				//console.log("[Profile]:giveNotifications, username '" + username + "', failed to increase 'last_notification_id' in database");
				callBack(false);
				return;
			}

			var idStartFrom = resultId.value.last_notification_id;
			idStartFrom = idStartFrom - notifsCountToAllocate;
			endAllocate(idStartFrom);
		});
	} else {
		endAllocate(0);
	}

	function endAllocate(idStartFrom) {

		var arrElementAddFriendRequest = [];

		var elementSyncNotifications;

		if (sync) {
			elementSyncNotifications = new ltxElement("sync_notifications");
		}

		var notificationsToPush = [];

		for (var i = 0; i < notifications.length; i++) {
			var notificationInfo = notifications[i];

			if (notificationInfo.id) {
				notificationInfo.id = idStartFrom;
				notificationsToPush.push(notificationInfo);
				idStartFrom++;
			} else {
				notificationInfo.id = 0;
			}

			if (sync) {
				var elementNotif = new ltxElement("notif", { id: (notificationInfo.id ? notificationInfo.id : new Date().getTime()), type: notificationInfo.type, confirmation: (notificationInfo.id ? 1 : 0), from_jid: global.config.masterserver.username + "@" + global.config.masterserver.domain + "/" + global.startupParams.resource, message: "" });
				var elementNotifBody = exports.notificationsObject[notificationInfo.type].parseParams(notificationInfo.params);
				if (notificationInfo.login_bonus) {
					elementNotifBody.c("consecutive_login_bonus", notificationInfo.login_bonus);
				}
				elementNotif.children.push(elementNotifBody);
				elementSyncNotifications.children.push(elementNotif);

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
				//new ltx.Element("clan_invite_result",{result:result,nickname:profile_db.nick})	
				//return (typeof params.username === "string" && typeof params.initiator === "string" && typeof params.clan_name === "string" && typeof params.clan_id === "string");
				/*
					global.masterserver.response(stanza,new ltx.Element("clan_invite",{nickname:nickname}));
					var req_id = global.masterserver.request(profile_db_target.userid+"@warface/GameClient",new ltx.Element("clan_invite_request",{clan_name:clan_db.name,nickname:profile_db.nick}));
					global.clan_requests[req_id] = {clan_id:clan_db._id,sender:user_id,target:profile_db_target.userid};
				*/
				//return new ltxElement("invite_result", { profile_id: params.profile_id, jid: params.username + "@" + global.config.masterserver.domain + "/GameClient", nickname: params.nickname, status: params.status, location: params.location, experience: params.experience, result: params.result });
			}
		}

		if (notificationsToPush.length) {
			global.db.warface.profiles.findOneAndUpdate({ username: username }, { $push: { notifications: { "$each": notificationsToPush } } }, { projection: { "_id": 1 } }, function (errAddNotifs, resultAddNotifs) {

				if (errAddNotifs) {
					//console.log("[Profile]:giveNotifications, username '" + username + "', failed to execute push query to database");
					callBack(false);
					return;
				}

				if (!resultAddNotifs.lastErrorObject.updatedExisting) {
					//console.log("[Profile]:giveNotifications, username '" + username + "', failed to push notifs to database");
					callBack(false);
					return;
				}

				endPushToDb();
			});
		} else {
			endPushToDb();
		}

		function endPushToDb() {
			if (sync) {

				for (var i = 0; i < arrElementAddFriendRequest.length; i++) {
					global.xmppClient.request(username + "@" + global.config.masterserver.domain + "/GameClient", arrElementAddFriendRequest[i][0], arrElementAddFriendRequest[i][1])
				}

				global.xmppClient.request(username + "@" + global.config.masterserver.domain + "/GameClient", elementSyncNotifications);
			}
			callBack(true);
		}
	}
}

function openRandomBox(profileObject, randomBoxInfo, offerId, resultLtxArr, notificationInfoArr) {
	var itemsToGiveArr = [];
	for (var g = 0; g < randomBoxInfo.randomInfo.length; g++) {

		var groupInfo = randomBoxInfo.randomInfo[g];

		var randomWeight = Math.floor(Math.random() * groupInfo.totalWeight);

		for (var i = 0; i < groupInfo.items.length; i++) {

			var itemInfo = groupInfo.items[i];

			if (itemInfo.itemWinLimit) {

				if (!profileObject.win_limits[itemInfo.name]) {
					profileObject.win_limits[itemInfo.name] = 0;
				}

				profileObject.win_limits[itemInfo.name]++;

				if (profileObject.win_limits[itemInfo.name] >= itemInfo.itemWinLimit) {
					randomWeight = itemInfo.weight;
				}
			}
		}

		//console.log("[OpenRandomBox]:Random weight:" + randomWeight);
		var currentWeight = 0;
		for (var i = 0; i < groupInfo.items.length; i++) {
			var itemInfo = groupInfo.items[i];
			currentWeight = currentWeight + itemInfo.weight;
			//console.log("[OpenRandomBox]:Random CurrentWeight:" + currentWeight);
			if (currentWeight >= randomWeight) {

				if (itemInfo.itemWinLimit) {
					delete profileObject.win_limits[itemInfo.name];
				}

				itemsToGiveArr.push({ name: itemInfo.name, durabilityPoints: itemInfo.durabilityPoints, expirationTime: itemInfo.expirationTime, quantity: itemInfo.quantity, offerId: offerId });
				break;
			}
		}
	}
	exports.giveGameItem(profileObject, itemsToGiveArr, false, resultLtxArr, notificationInfoArr);
}

function openBundle(profileObject, bundleInfo, offerId, resultLtxArr, notificationInfoArr) {
	var itemsToGiveArr = [];
	for (var i = 0; i < bundleInfo.bundleInfo.length; i++) {
		var itemInfo = bundleInfo.bundleInfo[i];
		itemsToGiveArr.push({ name: itemInfo.name, durabilityPoints: itemInfo.durabilityPoints, expirationTime: itemInfo.expirationTime, quantity: itemInfo.quantity, offerId: offerId });
	}
	exports.giveGameItem(profileObject, itemsToGiveArr, false, resultLtxArr, notificationInfoArr);
}

exports.giveGameItem = function (profileObject, itemsToGiveArr, disableMachSpecialItem, resultLtxArr, notificationInfoArr) {

	for (var i = 0; i < itemsToGiveArr.length; i++) {

		var itemToGiveInfo = itemsToGiveArr[i];

		var specialItemInfo = global.resources.items.data[global.resources.items.data.findIndex(function (x) { return x.isShopItem == true && x.name == itemToGiveInfo.name; })];
		if (specialItemInfo && !disableMachSpecialItem) {
			//console.log("[Profile][GiveGameItem][Item]:Give type is Special");
			switch (specialItemInfo.itemType) {
				case "random_box":

					if (notificationInfoArr) {
						var elementPurchasedItem = new ltxElement("purchased_item");

						openRandomBox(profileObject, specialItemInfo, itemToGiveInfo.offerId, elementPurchasedItem.children, null);

						notificationInfoArr.push({ type: 8192, params: { name: itemToGiveInfo.name, elementPurchasedItemB64: Buffer.from(String(elementPurchasedItem)).toString('base64') } });

						if (resultLtxArr) {
							for (var l = 0; l < elementPurchasedItem.children.length; l++) {
								resultLtxArr.push(elementPurchasedItem.children[l]);
							}
						}

					} else {
						openRandomBox(profileObject, specialItemInfo, itemToGiveInfo.offerId, resultLtxArr, notificationInfoArr);
					}

					break;
				case "bundle":
					openBundle(profileObject, specialItemInfo, itemToGiveInfo.offerId, resultLtxArr, notificationInfoArr);
					break;
				case "exp":

					var oldExperience = profileObject.experience;
					var newExperience = profileObject.experience + itemToGiveInfo.quantity;

					var maxExp = scriptTools.getExpByLevel(2147483647);

					if (oldExperience < maxExp) {
						if (newExperience > maxExp) {
							newExperience = maxExp;
						}
					} else {
						newExperience = oldExperience;
					}



					profileObject.experience = newExperience;

					var addedExperience = newExperience - oldExperience;

					if (addedExperience > 0) {

						var oldRank = scriptTools.getLevelByExp(oldExperience);
						var newRank = scriptTools.getLevelByExp(newExperience);

						for (var r = oldRank; r < newRank; r++) {

							var profileProgressionReward = global.resources.objectCustomRules.progression_reward[newRank];

							if (profileProgressionReward) {
								exports.giveSpecialReward(profileObject, profileProgressionReward, null);
							}
						}

						var roomObject = profileObject.room_object;

						if (roomObject) {
							var playerObject = profileObject.room_player_object;
							playerObject.experience = newExperience;
							roomObject.core.revision++;
						}

						exports.updateAchievementsAmmount(profileObject, [{ id: 54, command: "set", amount: newRank }, { id: 55, command: "set", amount: newRank }, { id: 58, command: "set", amount: newRank }, { id: 413, command: "set", amount: newRank }], function (res) {
						});
					}
					if (resultLtxArr) {
						resultLtxArr.push(new ltxElement("exp", { name: itemToGiveInfo.name, added: addedExperience, total: newExperience, offerId: itemToGiveInfo.offerId }));
					}
					break;
				case "game_money":
					var oldGameMoney = profileObject.game_money;
					var newGameMoney = profileObject.game_money + itemToGiveInfo.quantity;
					if (newGameMoney > 2147483647) {
						newGameMoney = 2147483647;
					}
					profileObject.game_money = newGameMoney;

					var addedGameMoney = newGameMoney - oldGameMoney;

					if (addedGameMoney > 0) {
						exports.updateAchievementsAmmount(profileObject, [{ id: 114, command: "inc", amount: addedGameMoney }, { id: 115, command: "inc", amount: addedGameMoney }], function (res) {
						});
					}

					if (resultLtxArr) {
						resultLtxArr.push(new ltxElement("game_money", { name: itemToGiveInfo.name, added: addedGameMoney, total: newGameMoney, offerId: itemToGiveInfo.offerId }));
					}

					if (notificationInfoArr) {
						notificationInfoArr.push({ type: 2048, params: { currency: "game_money", type: 0, amount: itemToGiveInfo.quantity } });
					}

					break;
				case "crown_money":
					var oldCrownMoney = profileObject.crown_money;
					var newCrownMoney = profileObject.crown_money + itemToGiveInfo.quantity;
					if (newCrownMoney > 2147483647) {
						newCrownMoney = 2147483647;
					}
					profileObject.crown_money = newCrownMoney;

					var addedCrownMoney = newCrownMoney - oldCrownMoney;

					if (addedCrownMoney > 0) {
						exports.updateAchievementsAmmount(profileObject, [{ id: 111, command: "inc", amount: addedCrownMoney }, { id: 112, command: "inc", amount: addedCrownMoney }, { id: 113, command: "inc", amount: addedCrownMoney }], function (res) {
						});
					}

					if (resultLtxArr) {
						resultLtxArr.push(new ltxElement("crown_money", { name: itemToGiveInfo.name, added: addedCrownMoney, total: newCrownMoney, offerId: itemToGiveInfo.offerId }));
					}

					if (notificationInfoArr) {
						notificationInfoArr.push({ type: 2048, params: { currency: "crown_money", type: 0, amount: itemToGiveInfo.quantity } });
					}

					break;
				case "booster":
					exports.giveGameItem(profileObject, [itemToGiveInfo], true, resultLtxArr, notificationInfoArr);
					break;
				case "coin":
					exports.giveGameItem(profileObject, [itemToGiveInfo], true, resultLtxArr, notificationInfoArr);

					var roomObject = profileObject.room_object;

					if (resultLtxArr && resultLtxArr.length > 0 && roomObject) {
						if (roomObject.dedicatedServerJid != null) {
							var elementShopSyncConsumables = new ltxElement("shop_sync_consumables", { session_id: roomObject.session.id });
							var elementProfileItems = elementShopSyncConsumables.c("profile_items", { profile_id: profileObject._id });

							var itemInfo = resultLtxArr[resultLtxArr.length - 1].children[0].attrs
							elementProfileItems.c("item", { id: ((profileObject._id * 1000) + itemInfo.id), name: itemInfo.name, attached_to: itemInfo.attached_to, config: itemInfo.config, slot: itemInfo.slot, equipped: itemInfo.equipped, default: itemInfo.default, permanent: itemInfo.permanent, expired_confirmed: itemInfo.expired_confirmed, buy_time_utc: itemInfo.buy_time_utc, quantity: itemInfo.quantity });
							global.xmppClient.request(roomObject.dedicatedServerJid, elementShopSyncConsumables);
						}
					}
					break;
				case "mission_access":
					exports.giveGameItem(profileObject, [itemToGiveInfo], true, resultLtxArr, notificationInfoArr);

					var roomObject = profileObject.room_object;

					if (resultLtxArr && resultLtxArr.length > 0 && roomObject) {
						var playerObject = profileObject.room_player_object;
						playerObject.mission_access_tokens = resultLtxArr[resultLtxArr.length - 1].children[0].attrs.quantity;
						playerObject.status = scriptGameroom.getNewPlayerStatus(roomObject, playerObject.missions_unlocked, playerObject.classes_unlocked, playerObject.mission_access_tokens);
						roomObject.core.revision++;
					}
					break;
				case "clan":
					exports.giveGameItem(profileObject, [itemToGiveInfo], true, resultLtxArr, notificationInfoArr);
					break;
				case "meta_game":
					for (var m = 0; m < specialItemInfo.metagameInfo.length; m++) {

						var metagameOnActivate = specialItemInfo.metagameInfo[m];

						if (metagameOnActivate.action) {
							console.log("[Profile][GiveGameItem][Item][MetaGame]:Action not support");
						}

						if (metagameOnActivate.unlock_achievement) {
							exports.updateAchievementsAmmount(profileObject, [{ id: metagameOnActivate.unlock_achievement, command: "give" }], function (res) {

							});
						}
					}
					break;
				default:
					console.log("[Profile][GiveGameItem][Item]:Сouldn't find a handler for '" + specialItemInfo.itemType + "' item type");
			}
			continue;
		}

		if (itemToGiveInfo.durabilityPoints != 0) {
			//console.log("[Profile][GiveGameItem][Item]:Give type is Permanent");

			var profileItemObject;

			var profileItemIndex = profileObject.items.findIndex(function (x) { return x.durability_points != null && x.name == itemToGiveInfo.name });

			if (profileItemIndex != -1) {
				profileItemObject = profileObject.items[profileItemIndex];
				profileItemObject.expired_confirmed = 0;
				profileItemObject.durability_points += itemToGiveInfo.durabilityPoints;
			} else {
				profileItemObject = { "id": profileObject.items[profileObject.items.length - 1].id + 1, "name": itemToGiveInfo.name, "attached_to": "0", "config": "dm=0;material=default", "slot": 0, "equipped": 0, "default": 0, "permanent": 1, "expired_confirmed": 0, "buy_time_utc": (itemToGiveInfo.buyTimeUtc ? itemToGiveInfo.buyTimeUtc : Math.round((new Date().getTime()) / 1000)), "total_durability_points": itemToGiveInfo.durabilityPoints, "durability_points": itemToGiveInfo.durabilityPoints };
				profileObject.items.push(profileItemObject);
			}

			var elementProfileItem = new ltxElement("profile_item", { name: profileItemObject.name, profile_item_id: profileItemObject.id, offerId: itemToGiveInfo.offerId, added_expiration: 0, added_quantity: 0, error_status: 0 });
			elementProfileItem.c("item", profileItemObject);

			if (resultLtxArr) {
				resultLtxArr.push(elementProfileItem);
			}

			if (notificationInfoArr) {
				notificationInfoArr.push({ type: 256, params: { name: profileItemObject.name, offer_type: "Permanent" } });
			}

		} else if (itemToGiveInfo.expirationTime != "") {
			//console.log("[Profile][GiveGameItem][Item]:Give type is Expiration");

			var expirationTimeSplited = itemToGiveInfo.expirationTime.split(" ");

			var expirationTimeNumber = 0;
			if (expirationTimeSplited[1] == "hour") {
				expirationTimeNumber = Number(expirationTimeSplited[0]) * 3600;
			} else if (expirationTimeSplited[1] == "day") {
				expirationTimeNumber = Number(expirationTimeSplited[0]) * 86400;
			} else if (expirationTimeSplited[1] == "month") {
				expirationTimeNumber = Number(expirationTimeSplited[0]) * 2419200;
			} else {
				console.log("[Profile][GiveGameItem][Item]:Expiration time is undefined");
			}

			var profileItemObject;

			var profileItemIndex = profileObject.items.findIndex(function (x) { return x.seconds_left != null && x.name == itemToGiveInfo.name });

			var itemBuyTimeUtc = Math.round((new Date().getTime()) / 1000);

			var expirationTimeNumberFull = expirationTimeNumber;

			if (itemToGiveInfo.buyTimeUtc) {
				expirationTimeNumber -= (itemBuyTimeUtc - itemToGiveInfo.buyTimeUtc);
				if (expirationTimeNumber < 0) {
					expirationTimeNumber = 0;
				}
			}

			if (profileItemIndex != -1) {

				profileItemObject = profileObject.items[profileItemIndex];

				if (profileItemObject.expiration_time_utc - itemBuyTimeUtc > 0) {
					profileItemObject.expiration_time_utc = profileItemObject.expiration_time_utc + expirationTimeNumber;
				} else {
					profileItemObject.expiration_time_utc = itemBuyTimeUtc + expirationTimeNumber;
				}
				profileItemObject.seconds_left = profileItemObject.expiration_time_utc - itemBuyTimeUtc;
				profileItemObject.expired_confirmed = (profileItemObject.seconds_left > 0 ? 0 : 1);

			} else {
				profileItemObject = { "id": profileObject.items[profileObject.items.length - 1].id + 1, "name": itemToGiveInfo.name, "attached_to": "0", "config": "dm=0;material=default", "slot": 0, "equipped": 0, "default": 0, "permanent": 0, "expired_confirmed": (expirationTimeNumber > 0 ? 0 : 1), "buy_time_utc": (itemToGiveInfo.buyTimeUtc ? itemToGiveInfo.buyTimeUtc : itemBuyTimeUtc), "expiration_time_utc": itemBuyTimeUtc + expirationTimeNumber, "seconds_left": expirationTimeNumber };
				profileObject.items.push(profileItemObject);
			}

			var elementProfileItem = new ltxElement("profile_item", { name: profileItemObject.name, profile_item_id: profileItemObject.id, offerId: itemToGiveInfo.offerId, added_expiration: itemToGiveInfo.expirationTime, added_quantity: 0, error_status: 0 });
			elementProfileItem.c("item", { "id": profileItemObject.id, "name": profileItemObject.name, "attached_to": profileItemObject.attached_to, "config": profileItemObject.config, "slot": profileItemObject.slot, "equipped": profileItemObject.equipped, "default": profileItemObject.default, "permanent": profileItemObject.permanent, "expired_confirmed": profileItemObject.expired_confirmed, "buy_time_utc": profileItemObject.buy_time_utc, "expiration_time_utc": profileItemObject.expiration_time_utc, "seconds_left": profileItemObject.seconds_left, "hours_left": Math.round(profileItemObject.seconds_left / 3600) });

			if (resultLtxArr) {
				resultLtxArr.push(elementProfileItem);
			}

			if (notificationInfoArr) {
				notificationInfoArr.push({ type: 256, params: { name: profileItemObject.name, offer_type: "Expiration", extended_time: Math.round(expirationTimeNumberFull / 3600) } });
			}

		} else if (itemToGiveInfo.quantity != 0) {
			//console.log("[Profile][GiveGameItem][Item]:Give type is Quantity");

			var profileItemObject;

			var profileItemIndex = profileObject.items.findIndex(function (x) { return x.quantity != null && x.name == itemToGiveInfo.name });

			if (profileItemIndex != -1) {
				profileItemObject = profileObject.items[profileItemIndex];
				profileItemObject.quantity += itemToGiveInfo.quantity;
				profileItemObject.expired_confirmed = 0;
			} else {
				profileItemObject = { "id": profileObject.items[profileObject.items.length - 1].id + 1, "name": itemToGiveInfo.name, "attached_to": "0", "config": "dm=0;material=default", "slot": 0, "equipped": 0, "default": 0, "permanent": 0, "expired_confirmed": 0, "buy_time_utc": (itemToGiveInfo.buyTimeUtc ? itemToGiveInfo.buyTimeUtc : Math.round((new Date().getTime()) / 1000)), "quantity": itemToGiveInfo.quantity }
				profileObject.items.push(profileItemObject);
			}

			var elementProfileItem = new ltxElement("profile_item", { name: profileItemObject.name, profile_item_id: profileItemObject.id, offerId: itemToGiveInfo.offerId, added_expiration: 0, added_quantity: itemToGiveInfo.quantity, error_status: 0 });
			elementProfileItem.c("item", profileItemObject);

			if (resultLtxArr) {
				resultLtxArr.push(elementProfileItem);
			}

			if (notificationInfoArr) {
				notificationInfoArr.push({ type: 256, params: { name: profileItemObject.name, offer_type: "Consumable", consumables_count: itemToGiveInfo.quantity } });
			}

			var elementGetExpiredItems = new ltxElement("get_expired_items");
			elementGetExpiredItems.c("consumable_item", profileItemObject);
			global.xmppClient.request(profileObject.username + "@" + global.config.masterserver.domain + "/GameClient", elementGetExpiredItems);

		} else {
			//console.log("[Profile][GiveGameItem][Item]:Give type is Unlimited");

			profileItemObject = { "id": profileObject.items[profileObject.items.length - 1].id + 1, "name": itemToGiveInfo.name, "attached_to": "0", "config": "dm=0;material=default", "slot": 0, "equipped": 0, "default": 0, "permanent": 0, "expired_confirmed": 0, "buy_time_utc": (itemToGiveInfo.buyTimeUtc ? itemToGiveInfo.buyTimeUtc : Math.round((new Date().getTime()) / 1000)) }
			profileObject.items.push(profileItemObject);

			var elementProfileItem = new ltxElement("profile_item", { name: profileItemObject.name, profile_item_id: profileItemObject.id, offerId: itemToGiveInfo.offerId, added_expiration: 0, added_quantity: 0, error_status: 0 });
			elementProfileItem.c("item", profileItemObject);

			if (resultLtxArr) {
				resultLtxArr.push(elementProfileItem);
			}

			if (notificationInfoArr) {
				notificationInfoArr.push({ type: 256, params: { name: profileItemObject.name, offer_type: "Permanent" } });
			}

		}

	}

}

exports.updateProfilePerformance = function (profileObject, isWin, missionId, newPerformance) {

	var profilePerformance = profileObject.profile_performance;

	//Если в профиле ещё нету такой миссии, то создать как проваленную
	if (profilePerformance[missionId] == null) {
		profilePerformance[missionId] = { success: 0, leaderboard: { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } };
	}

	//Если миссия выполнена
	if (isWin == true) {
		profilePerformance[missionId].success = 1;

		//Если миссиия была пройдена с лучшими показателями, то записать их в бд
		if (newPerformance["0"] > profilePerformance[missionId].leaderboard["0"]) {
			profilePerformance[missionId].leaderboard["0"] = newPerformance["0"];
		}

		if (newPerformance["1"] > profilePerformance[missionId].leaderboard["1"]) {
			profilePerformance[missionId].leaderboard["1"] = newPerformance["1"];
		}

		if (newPerformance["2"] > profilePerformance[missionId].leaderboard["2"]) {
			profilePerformance[missionId].leaderboard["2"] = newPerformance["2"];
		}

		if (newPerformance["3"] > profilePerformance[missionId].leaderboard["3"]) {
			profilePerformance[missionId].leaderboard["3"] = newPerformance["3"];
		}

		if (newPerformance["4"] > profilePerformance[missionId].leaderboard["4"]) {
			profilePerformance[missionId].leaderboard["4"] = newPerformance["4"];
		}

		if (newPerformance["5"] > profilePerformance[missionId].leaderboard["5"]) {
			profilePerformance[missionId].leaderboard["5"] = newPerformance["5"];
		}
	}
}

exports.updateAchievementsAmmount = function (profileObject, achievementsArr, callBack) {

	var notificationsInfoArr = [];

	for (var i = 0; i < achievementsArr.length; i++) {

		var achievementObject = achievementsArr[i];

		var achievementInfoIndex = global.resources.achievementsArr.findIndex(function (x) { return x.id == achievementObject.id });

		if (achievementInfoIndex == -1) {
			//console.log("[Tools][updateAchievementsAmmount][" + profileObject._id + "]:Сouldn't find information about the achievement '" + achievementObject.id + "'");
			continue;
		}

		var achievementInfo = global.resources.achievementsArr[achievementInfoIndex];

		//Валидация параметров
		if (achievementObject.command == "set") {
			if (typeof achievementObject.amount != "number" || Number.isNaN(achievementObject.amount) || achievementObject.amount < 0) {
				//console.log("[Tools][updateAchievementsAmmount][" + profileObject._id + "]:Incorrect amount for command '" + achievementObject.command + "'");
				continue;
			}
		} else if (achievementObject.command == "inc") {
			if (typeof achievementObject.amount != "number" || Number.isNaN(achievementObject.amount) || achievementObject.amount < 1) {
				//console.log("[Tools][updateAchievementsAmmount][" + profileObject._id + "]:Incorrect amount for command '" + achievementObject.command + "'");
				continue;
			}
		} else if (achievementObject.command == "give") {
			//Тут проверять нечего
		} else {
			//console.log("[Tools][updateAchievementsAmmount][" + profileObject._id + "]:Unknown command '" + achievementObject.command + "'");
			continue;
		}

		var achievementProfileIndex = profileObject.achievements.findIndex(function (x) { return x.achievement_id == achievementObject.id });

		if (achievementProfileIndex == -1) {
			profileObject.achievements.push({ achievement_id: achievementObject.id, progress: 0, completion_time: 0 });
			achievementProfileIndex = profileObject.achievements.length - 1;
		}

		var achievementProfile = profileObject.achievements[achievementProfileIndex];

		var achievementProfileOldProgress = achievementProfile.progress;

		//Определение нового количества прогресса достяжения
		if (achievementObject.command == "set") {
			achievementProfile.progress = achievementObject.amount;
		} else if (achievementObject.command == "inc") {
			achievementProfile.progress = achievementProfile.progress + achievementObject.amount;
		} else if (achievementObject.command == "give") {
			achievementProfile.progress = achievementInfo.amount;
		}

		//Валидация максимального количества прогресса достяжения
		if (achievementProfile.progress > achievementInfo.amount) {
			achievementProfile.progress = achievementInfo.amount;
		}

		if (achievementProfile.progress != achievementProfileOldProgress) {

			if (achievementProfile.progress == achievementInfo.amount) {
				if (achievementInfo.time != null && typeof achievementInfo.time == "number" && Number.isNaN(achievementInfo.time) == false && achievementInfo.time > -1) {
					achievementProfile.completion_time = achievementInfo.time;
				} else {
					achievementProfile.completion_time = Math.round((new Date().getTime()) / 1000);
				}
			} else {
				achievementProfile.completion_time = 0;
			}

			notificationsInfoArr.push({ type: 4, params: achievementProfile });
		}
	}

	if (notificationsInfoArr.length == 0) {
		//console.log("[Tools][updateAchievementsAmmount][" + profileObject._id + "]:No updates");
		callBack();
		return;
	}

	exports.giveNotifications(profileObject.username, notificationsInfoArr, true, function (nAddResult) {

		if (!nAddResult) {
			//console.log("[Tools][updateAchievementsAmmount][" + profileObject._id + "]:Give failed");
		}

		callBack();
		return;
	});

}

exports.save = function (profileObject, callBack) {

	global.db.warface.profiles.findOneAndUpdate({ username: profileObject.username }, {
		$set: {
			//"_id": profileObject._id,
			//"username": profileObject.username,
			"gender": profileObject.gender,
			"height": profileObject.height,
			"fatness": profileObject.fatness,
			"game_money": profileObject.game_money,
			"cry_money": profileObject.cry_money,
			"crown_money": profileObject.crown_money,
			"experience": profileObject.experience,
			"current_class": profileObject.current_class,
			"banner_badge": profileObject.banner_badge,
			"banner_mark": profileObject.banner_mark,
			"banner_stripe": profileObject.banner_stripe,
			//"status": profileObject.status,
			//"location": profileObject.location,
			"nick": profileObject.nick,
			//"clan_name": profileObject.clan_name,
			"head": profileObject.head,
			"items": profileObject.items,
			"expired_items": profileObject.expired_items,
			"missions_unlocked": profileObject.missions_unlocked,
			"tutorial_passed": profileObject.tutorial_passed,
			"tutorials_passed": profileObject.tutorials_passed,
			"classes_unlocked": profileObject.classes_unlocked,
			"persistent_settings": profileObject.persistent_settings,
			"achievements": profileObject.achievements,
			"is_starting_achievements_issued": profileObject.is_starting_achievements_issued,
			"stats": profileObject.stats,
			"contracts": profileObject.contracts,
			"profile_performance": profileObject.profile_performance,
			"wpn_usage": profileObject.wpn_usage,
			"login_bonus": profileObject.login_bonus,
			"win_limits": profileObject.win_limits,
			"pvp_rating_points": profileObject.pvp_rating_points
			//"room_object": null,
			//"room_player_object": null,
			//"region_id": region_id
		}
	}, { projection: { "_id": 1 } }, callBack);

}

exports.giveSpecialReward = function (profileObject, rewardName, loginBonusInfo) {

	var rewardInfo = global.resources.objectSpecialRewardConfiguration[rewardName];

	if (!rewardInfo) {
		console.log("[Profile][GiveSpecialReward][" + profileObject._id + "]:Give failed, reward '" + rewardName + "' not found");
		return;
	}

	var notifiactionsArr = [];

	exports.giveGameItem(profileObject, rewardInfo.rewards, false, null, notifiactionsArr);

	if (loginBonusInfo) {
		for (var i = 0; i < notifiactionsArr.length; i++) {
			notifiactionsArr[i].login_bonus = loginBonusInfo;
		}
	}

	exports.giveNotifications(profileObject.username, notifiactionsArr, true, function (nAddResult) {

	});
}

var localClassesIndexesTable = ["rifleman", "heavy", "sniper", "medic", "engineer"];

exports.unlockClass = function (profileObject, className) {

	var classIdToUnlock = localClassesIndexesTable.indexOf(className);

	if (classIdToUnlock == -1) {
		console.log("[" + profileObject._id + "][Profile][UnlockClass]:Failed to find className '" + className + "'");
		return;
	}

	if (profileObject.classes_unlocked.indexOf(classIdToUnlock) == -1) {
		profileObject.classes_unlocked.push(classIdToUnlock);
		exports.giveNotifications(profileObject.username, [{ type: 8, params: { data: "@" + className.toUpperCase() + "_unlocked" } }], true, function (nAddResult) {

		})
	}
}

exports.getExpiredItems = function (profileObject, expiresArr) {

	function setDefaultItem() {

		//console.log(itemObject);

		var itemSlot = itemObject.slot;

		itemObject.slot = 0;
		itemObject.equipped = 0;

		//console.log("[Profile][GetExpiredItems]:Item slot:" + itemSlot);

		if (itemSlot == 0) {
			return 0;
		}

		var itemSlotArr = scriptTools.getItemSlotArr(itemSlot);
		//console.log(itemSlotArr);

		var itemClass = scriptTools.getItemClassFromSlotArr(itemSlotArr);
		//console.log(itemClass);

		var itemType = scriptTools.getItemTypeFromSlotArr(itemSlotArr);
		//console.log(itemType);

		var itemDefaultClass = global.resources.defaultItemsNames[itemClass];
		//console.log(itemDefaultClass);

		if (!itemDefaultClass) {
			return 0;
		}

		var itemDefaultName = itemDefaultClass[itemType];
		//console.log(itemDefaultName);

		if (!itemDefaultName) {
			return 0;
		}

		var itemDefaultObject = profileObject.items[profileObject.items.findIndex(function (x) { return (x.default == 1 && x.name == itemDefaultName) })];
		//console.log(itemDefaultObject);

		if (!itemDefaultObject) {
			return 0;
		}

		var itemDefaultSlotArr = scriptTools.getItemSlotArr(itemDefaultObject.slot);
		//console.log(itemDefaultSlotArr);

		if (itemSlotArr[0]) {
			itemDefaultSlotArr[0] = itemSlotArr[0];
		}

		if (itemSlotArr[1]) {
			itemDefaultSlotArr[1] = itemSlotArr[1];
		}

		if (itemSlotArr[2]) {
			itemDefaultSlotArr[2] = itemSlotArr[2];
		}

		if (itemSlotArr[3]) {
			itemDefaultSlotArr[3] = itemSlotArr[3];
		}

		if (itemSlotArr[4]) {
			itemDefaultSlotArr[4] = itemSlotArr[4];
		}

		//console.log(itemDefaultSlotArr);

		var itemDefaultSlot = scriptTools.getItemSlotFromSlotArr(itemDefaultSlotArr);
		var itemDefaulEquipped = scriptTools.getItemEquippedFromSlotArr(itemDefaultSlotArr);

		//console.log(itemDefaultSlot);
		//console.log(itemDefaulEquipped);

		itemDefaultObject.slot = itemDefaultSlot;
		itemDefaultObject.equipped = itemDefaulEquipped;

		return itemDefaultSlot;
	}

	function addExpire() {

		var defSlot = setDefaultItem();
		itemObject.expired_confirmed = 1;

		var expiredObject = { id: itemObject.id, name: itemObject.name, slot_ids: defSlot };
		profileObject.expired_items.push(expiredObject);
		if (expiresArr) {
			expiresArr.push(expiredObject);
		}
	}

	var currentTime = Math.round(new Date().getTime() / 1000);

	for (var i = 0; i < profileObject.items.length; i++) {

		var itemObject = profileObject.items[i];

		if (itemObject.expired_confirmed == 1) {
			continue;
		} else if (itemObject.durability_points != null) {

			if (itemObject.durability_points < 1) {
				itemObject.durability_points = 0;
				addExpire();
			}

		} else if (itemObject.quantity != null) {

			if (itemObject.quantity < 1) {
				itemObject.quantity = 0;
				addExpire();
			}

		} else if (itemObject.seconds_left != null) {

			if (itemObject.expiration_time_utc <= currentTime) {
				itemObject.seconds_left = 0;
				addExpire();
			} else {
				itemObject.seconds_left = itemObject.expiration_time_utc - currentTime;
			}

		}

	}
}