var ltx = require("ltx");
var scriptGameroom = require('./gameroom.js');

exports.init = function (callBackInit) {
	global.cache = {};

	var cacheIsFirstUpdate = true;

	var cacheUpdateHandlers = [
		{ name: "shop", "handler": cacheHandlerShop, hash: 0 },
		{ name: "clan_list", "handler": cacheClanList, hash: 0, isAll: true },
		{ name: "missions_pve", "handler": cacheMissionsPvE, hash: 0 },
		{ name: "performance", "handler": cachePerformance, hash: 0 }
	];

	function updateCache() {
		var i = 0;
		function updateCacheRecursive(callbackEnd) {
			if (i < cacheUpdateHandlers.length) {
				var cacheInfo = cacheUpdateHandlers[i];

				var dbCacheCollection = global.db.warface.cache;

				if (cacheInfo.isAll) {
					dbCacheCollection = global.db.warface.cache_all_all;
				}

				dbCacheCollection.findOne({ _id: cacheInfo.name }, { projection: { "hash": 1 } }, function (err, dbCache) {
					if (dbCache != null) {
						if (dbCache.hash != cacheInfo.hash) {
							dbCacheCollection.findOne({ _id: cacheInfo.name }, { projection: { "_id": 0 } }, function (err1, dbCacheData) {
								if (dbCacheData != null && dbCacheData.data != null) {
									global.cache[cacheInfo.name] = { hash: dbCacheData.hash, data: dbCacheData.data };
									cacheInfo.hash = dbCacheData.hash;
									cacheInfo.handler(global.cache[cacheInfo.name], function () {
										console.log("[CacheDynamic]:Cache '" + cacheInfo.name + "' updated");
										i++;
										updateCacheRecursive(callbackEnd)
									});
								} else {
									console.log("[CacheDynamic]:Cache '" + cacheInfo.name + "' get data failed")
									setTimeout(updateCacheRecursive, 1000, callbackEnd);
								}
							});
						} else {
							//console.log("[CacheDynamic]:Cache '"+cacheInfo.name+"' ok")
							i++;
							updateCacheRecursive(callbackEnd);
						}
					} else {
						console.log("[CacheDynamic]:Cache '" + cacheInfo.name + "' get hash failed")
						setTimeout(updateCacheRecursive, 1000, callbackEnd);
					}
				});
			} else {
				callbackEnd();
			}
		}
		updateCacheRecursive(function () {
			if (cacheIsFirstUpdate == true) {
				cacheIsFirstUpdate = false;
				callBackInit();
			}
			setTimeout(updateCache, 10000);
		});
	}

	global.CacheQuickAccess = {};

	function cacheHandlerShop(cacheData, callback) {
		global.CacheQuickAccess.shopOffersObject = { id: {} };
		for (var i = 0; cacheData.data.length > i; i++) {
			global.CacheQuickAccess.shopOffersObject.id[cacheData.data[i].id] = cacheData.data[i];
		}

		var elementShopGetOffers = new ltx.Element("shop_get_offers", { code: 3, from: 0, to: 0, hash: global.cache.shop.hash });

		for (var i = 0; i < global.cache.shop.data.length; i++) {
			var offerInfo = global.cache.shop.data[i];
			elementShopGetOffers.c("offer", offerInfo);
			elementShopGetOffers.attrs.to++;
		}

		for (userJid in global.users.jid) {
			global.xmppClient.request(userJid, elementShopGetOffers);
		}

		callback();
	}

	function cacheClanList(cacheData, callback) {
		callback();
	}

	function cacheMissionsPvE(cacheData, callback) {
		global.CacheQuickAccess.missionsPvE = { uid: {}, ltxCached: new ltx.Element("missions_get_list", { hash: cacheData.hash, content_hash: cacheData.hash }), hash: cacheData.hash };
		for (var i = 0; cacheData.data.length > i; i++) {
			var parsedData = ltx.parse(cacheData.data[i]);
			global.CacheQuickAccess.missionsPvE.uid[parsedData.attrs.uid] = parsedData;

			var mElementBasemap = parsedData.getChild("Basemap");
			var mElementUi = parsedData.getChild("UI");
			var mElementDescription = mElementUi.getChild("Description");
			var mElementGameMode = mElementUi.getChild("GameMode");

			var cElementMission = global.CacheQuickAccess.missionsPvE.ltxCached.c("mission", { mission_key: parsedData.attrs.uid, no_teams: "1", name: parsedData.attrs.name, setting: mElementBasemap.attrs.name, mode: parsedData.attrs.game_mode, mode_name: mElementGameMode.attrs.text, mode_icon: mElementGameMode.attrs.icon, description: mElementDescription.attrs.text, image: mElementDescription.attrs.icon, difficulty: parsedData.attrs.difficulty, type: parsedData.attrs.mission_type, time_of_day: parsedData.attrs.time_of_day });
			var mElementSublevelsArr = parsedData.getChild("Sublevels").getChildren("Sublevel");
			var cElementObjectives = cElementMission.c("objectives", { factor: mElementSublevelsArr.length });

			var mElementObjectivesArr = parsedData.getChild("Objectives").getChildren("Objective");
			for (var o = 0; o < mElementObjectivesArr.length; o++) {
				var mElementObjective = mElementObjectivesArr[o];
				cElementObjectives.c("objective", { id: mElementObjective.attrs.id ? mElementObjective.attrs.id : "0", type: mElementObjective.attrs.type });
			}

			var vCrownRewardsAndThresholds = scriptGameroom.getCrownRewardsAndThresholdsObject(parsedData);

			if (vCrownRewardsAndThresholds != null) {
				var cElementCrownRewardsThresholds = cElementMission.c("CrownRewardsThresholds");
				cElementCrownRewardsThresholds.c("TotalPerformance", vCrownRewardsAndThresholds.TotalPerformance);
				cElementCrownRewardsThresholds.c("Time", vCrownRewardsAndThresholds.Time);
				cElementMission.c("CrownRewards", vCrownRewardsAndThresholds.CrownRewards);
			}
		}

		for (userJid in global.users.jid) {
			global.xmppClient.request(userJid, global.CacheQuickAccess.missionsPvE.ltxCached);
		}

		callback();
	}

	function cachePerformance(cacheData, callback) {

		function localSortByStat(arr, id_stat) {
			arr.sort((a, b) => a.stats[id_stat] > b.stats[id_stat] ? -1 : 1);
		}

		var performanceJson = {};

		for (var i = 0; i < cacheData.data.length; i++) {

			var performanceInfo = cacheData.data[i];

			if (performanceJson[performanceInfo.mission_id] == null) {
				performanceJson[performanceInfo.mission_id] = { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [] };
			}

			performanceJson[performanceInfo.mission_id]["0"].push(performanceInfo);
			performanceJson[performanceInfo.mission_id]["1"].push(performanceInfo);
			performanceJson[performanceInfo.mission_id]["2"].push(performanceInfo);
			performanceJson[performanceInfo.mission_id]["3"].push(performanceInfo);
			performanceJson[performanceInfo.mission_id]["4"].push(performanceInfo);
			performanceJson[performanceInfo.mission_id]["5"].push(performanceInfo);
			delete performanceInfo.mission_id;
		}

		for (pKey in performanceJson) {
			localSortByStat(performanceJson[pKey]["0"], "0");
			localSortByStat(performanceJson[pKey]["1"], "1");
			localSortByStat(performanceJson[pKey]["2"], "2");
			localSortByStat(performanceJson[pKey]["3"], "3");
			localSortByStat(performanceJson[pKey]["4"], "4");
			localSortByStat(performanceJson[pKey]["5"], "5");
		}

		global.CacheQuickAccess.performance = performanceJson;
		callback();
	}

	updateCache();
}