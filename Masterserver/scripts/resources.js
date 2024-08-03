const fs = require("fs");
const ltx = require("ltx");
//var scriptTools = require('./tools.js');


global.resources = {};

exports.load = function () {
	//console.log("[ResourcesLoad]:Loading...");
	loadItems();
	loadExpCurveTable();
	loadDefaultSlots();
	loadDefaultItems();
	loadGameModesConfig();
	loadRewardsConfiguration();
	loadMissions();
	loadQuickplayMaps();
	loadAchievementsList();
	loadSpecialRewardConfiguration();
	loadProfileProgressionConfig();
	loadCustomRules();
	loadRatingCurve();
	loadConfigs();
	//console.log("[ResourcesLoad]:Success");
}

var getFiles = function (dir, files_) {

	files_ = files_ || [];
	var files;

	try {
		files = fs.readdirSync(dir);
	} catch (e) {

	}

	for (var i in files) {
		var name = dir + '/' + files[i];
		if (fs.statSync(name).isDirectory()) {
			getFiles(name, files_);
		} else {
			files_.push(name);
		}
	}
	return files_;
};

function removeTextFromLtxElements(ltxElementC) {
	var newClildrenElementsArr = [];
	for (var i = 0; i < ltxElementC.children.length; i++) {
		if (typeof ltxElementC.children[i] == "object") {
			removeTextFromLtxElements(ltxElementC.children[i])
			newClildrenElementsArr.push(ltxElementC.children[i]);
		}
	}
	ltxElementC.children = newClildrenElementsArr;
}

function errorGetChild(fName, fcName, cName) {
	console.log("[ResourceLoad][" + fName + "]:Failed to get child '" + fcName + "' in '" + cName + "'");
	throw "";
}

function errorBadAttr(fName, attrName, eName) {
	console.log("[ResourceLoad][" + fName + "]:Attribute '" + attrName + "' in '" + eName + "' is bad");
	throw "";
}

function errorBadChildElement(fName, cName, eName) {
	console.log("[ResourceLoad][" + fName + "]:Child '" + cName + "' in '" + eName + "' is have bad child");
	throw "";
}

function loadItems() {
	console.log("[ResourcesLoad]:Loading Items");

	var itemsNamesIgnoreList = [
		"mission_access_token_01",
		"mission_access_token_02",
		"mission_access_token_03"
	]

	var resultData = [];
	var items_paths = getFiles("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/items");
	var cur_item_id = 1;
	for (cur_item in items_paths) {
		var item_path = items_paths[cur_item].split("/");
		var item_file_name = item_path[item_path.length - 1].split(".");
		if (item_file_name[1] == "xml") {
			//console.log("[UpdateConfigs][Items]:Caching item " + items_paths[cur_item]);
			var cur_data = ltx.parse(fs.readFileSync(items_paths[cur_item]));

			//Игнорировние некторых предметов
			if (itemsNamesIgnoreList.indexOf(cur_data.attrs.name) != -1) {
				//console.log("[UpdateConfigs][Items]:Item '" + cur_data.attrs.name + "' is ignored by list");
				continue;
			}

			if (cur_data.getChild("UI_stats") != null) {
				var paramMaxBuyAmount = 0;
				var paramRepairCost = 0;
				var elementMmoStats = cur_data.getChild("mmo_stats");
				if (elementMmoStats != null) {

					var elementParamMaxBuyAmount = elementMmoStats.getChildByAttr("name", "max_buy_amount");
					if (elementParamMaxBuyAmount != null) {
						paramMaxBuyAmount = Number(elementParamMaxBuyAmount.attrs.value);
					}

					var elementParamRepairCost = elementMmoStats.getChildByAttr("name", "repair_cost");
					if (elementParamRepairCost != null) {
						paramRepairCost = Number(elementParamRepairCost.attrs.value);
					}
				}
				var itemBaseObject = { id: cur_item_id, name: cur_data.attrs.name, locked: 0, max_buy_amount: paramMaxBuyAmount, repair_cost: paramRepairCost };

				var pathSplited = items_paths[cur_item].split("/");
				if (pathSplited[pathSplited.length - 2].toLowerCase() == "shopitems") {
					itemBaseObject.isShopItem = true;
					itemBaseObject.itemType = cur_data.attrs.type;
					if (itemBaseObject.itemType == "random_box") {
						itemBaseObject.randomInfo = getRandomBoxInfo(cur_data);
					}
					if (itemBaseObject.itemType == "bundle") {
						itemBaseObject.bundleInfo = getBundleInfo(cur_data);
					}
					if (itemBaseObject.itemType == "booster") {
						itemBaseObject.boosterInfo = getBoosterInfo(cur_data);
					}
					if (itemBaseObject.itemType == "meta_game") {
						itemBaseObject.metagameInfo = getMetaGameInfo(cur_data);
					}
				}

				resultData.push(itemBaseObject);
				cur_item_id++;
			}
		}
	}

	global.resources.items = { hash: Math.round(new Date().getTime() / 1000), data: resultData };

	function getMetaGameInfo(metagameItem) {

		var metagameInfoArr = [];

		var elementMetagameStats = metagameItem.getChild("metagame_stats");
		if (!elementMetagameStats) {
			console.log("[CreateCacheItems]:MetaGame " + metagameItem.attrs.name + " failed to get child metagame_stats");
			throw "";
		}

		var elementsOnActivate = elementMetagameStats.getChildren("on_activate");
		if (!elementsOnActivate.length) {
			console.log("[Warning][CreateCacheItems]:MetaGame " + metagameItem.attrs.name + " not found childs on_activate in metagame_stats");
		}

		for (var i = 0; i < elementsOnActivate.length; i++) {

			var metagameInfoObject = {};

			var elementOnActivate = elementsOnActivate[i];

			var attrUnlockAchievement = Number(elementOnActivate.attrs.unlock_achievement);
			var attrAction = elementOnActivate.attrs.action;

			if (!Number.isNaN(attrUnlockAchievement)) {
				metagameInfoObject.unlock_achievement = attrUnlockAchievement;
			}

			if (attrAction) {
				metagameInfoObject.action = attrAction;
			}

			metagameInfoArr.push(metagameInfoObject);
		}

		return metagameInfoArr;
	}

	function getBundleInfo(bundleItem) {
		var bundleItemsArr = [];

		var elementsItem = bundleItem.getChild("bundle").getChildren("item");
		for (var i = 0; i < elementsItem.length; i++) {
			var itemInfo = elementsItem[i].attrs;

			var itemName = itemInfo.name;
			if (itemName == null) {
				console.log("[UpdateConfigs][Items]:Bundle 0 is not have attribute 'name' in group:" + g + " item:" + i);
				throw "";
			}

			var itemQuantity = Number(itemInfo.amount);
			if (Number.isNaN(itemQuantity) == true) {
				itemQuantity = 0;
			}

			var itemExpirationTime = itemInfo.expiration;
			if (itemExpirationTime != null && itemExpirationTime != "" && itemExpirationTime != "0") {
				var timeUnit = itemExpirationTime[itemExpirationTime.length - 1];
				var timeCount = itemExpirationTime.slice(0, -1);
				switch (timeUnit) {
					case "d":
						itemExpirationTime = timeCount + " day";
						break;
					case "h":
						itemExpirationTime = timeCount + " hour";
						break;
					case "m":
						itemExpirationTime = timeCount + " month";
						break;
					default:
						console.log("[UpdateConfigs][Items]:Bundle '" + itemName + "' group:" + g + " item:" + i + " timeUnit: '" + timeUnit + "' is unknown!");
						throw "";
				}

			} else {
				itemExpirationTime = "";
			}

			var durabilityPoints = 0;
			if (itemQuantity == 0 && itemExpirationTime == "" && itemName.indexOf("_fbs_") == -1) {
				durabilityPoints = 36000;
			}

			bundleItemsArr.push({ name: itemName, quantity: itemQuantity, expirationTime: itemExpirationTime, durabilityPoints: durabilityPoints });
		}

		return bundleItemsArr;
	}

	function sortItemsByWeight(arr) {
		arr.sort((a, b) => a.weight > b.weight ? 1 : -1);
	}

	function getRandomBoxInfo(randomItem) {
		var randomboxGroupsInfo = [];
		var elementGroups = randomItem.getChild("random_box").getChildren("group");

		for (var g = 0; g < elementGroups.length; g++) {
			var groupInfo = { items: [], totalWeight: 0 };

			var elementItems = elementGroups[g].getChildren("item");
			for (var i = 0; i < elementItems.length; i++) {
				var itemInfo = elementItems[i].attrs;

				var itemName = itemInfo.name;
				if (itemName == null) {
					console.log("[UpdateConfigs][Items]:Randombox '" + "Name" + "' is not have attribute 'name' in group:" + g + " item:" + i);
					throw "";
				}

				var itemWeight = Number(itemInfo.weight);
				if (Number.isNaN(itemWeight) == true) {
					console.log("[UpdateConfigs][Items]:Randombox '" + "Name" + "' is not have attribute 'weight' in group:" + g + " item:" + i);
					throw "";
				}

				var itemQuantity = Number(itemInfo.amount);
				if (Number.isNaN(itemQuantity) == true) {
					itemQuantity = 0;
				}

				var itemExpirationTime = itemInfo.expiration;
				if (itemExpirationTime != null && itemExpirationTime != "" && itemExpirationTime != "0") {
					var timeUnit = itemExpirationTime[itemExpirationTime.length - 1];
					var timeCount = itemExpirationTime.slice(0, -1);
					switch (timeUnit) {
						case "d":
							itemExpirationTime = timeCount + " day";
							break;
						case "h":
							itemExpirationTime = timeCount + " hour";
							break;
						case "m":
							itemExpirationTime = timeCount + " month";
							break;
						default:
							console.log("[UpdateConfigs][Items]:Randombox '" + "Name" + "' group:" + g + " item:" + i + " timeUnit: '" + timeUnit + "' is unknown!");
							throw "";
					}

				} else {
					itemExpirationTime = "";
				}

				var durabilityPoints = 0;
				if (itemQuantity == 0 && itemExpirationTime == "" && itemName.indexOf("_fbs_") == -1) {
					durabilityPoints = 36000;
				}

				var itemWinLimit = Number(itemInfo.win_limit);
				if (Number.isNaN(itemWinLimit) == true) {
					itemWinLimit = 0;
				}

				groupInfo.items.push({ name: itemInfo.name, weight: itemWeight, quantity: itemQuantity, expirationTime: itemExpirationTime, durabilityPoints: durabilityPoints, itemWinLimit: itemWinLimit });

				groupInfo.totalWeight = groupInfo.totalWeight + itemWeight;
			}

			sortItemsByWeight(groupInfo.items);

			randomboxGroupsInfo.push(groupInfo);
		}
		return randomboxGroupsInfo;
	}

	function getBoosterInfo(boosterItem) {

		var boosterInfoObject = { vpBoost: 0, gmBoost: 0, xpBoost: 0, zbBoost: 0 };

		var elementGameParams = boosterItem.getChild("GameParams");
		if (elementGameParams) {

			var elementVpBoost = elementGameParams.getChildByAttr("name", "vpBoost")
			if (elementVpBoost) {
				boosterInfoObject.vpBoost = Number(elementVpBoost.attrs.value);
			}

			var elementGmBoost = elementGameParams.getChildByAttr("name", "gmBoost")
			if (elementGmBoost) {
				boosterInfoObject.gmBoost = Number(elementGmBoost.attrs.value);
			}

			var elementXpBoost = elementGameParams.getChildByAttr("name", "xpBoost")
			if (elementXpBoost) {
				boosterInfoObject.xpBoost = Number(elementXpBoost.attrs.value);
			}

			var elementZbBoost = elementGameParams.getChildByAttr("name", "zbBoost")
			if (elementZbBoost) {
				boosterInfoObject.zbBoost = Number(elementZbBoost.attrs.value);
			}
		}

		return boosterInfoObject;
	}

}

function loadExpCurveTable() {
	console.log("[ResourcesLoad]:Loading ExpCurveTable");
	global.resources.tableExpCurve = {};
	var ExpCurve = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/expcurve.xml"));
	for (var i = 0; i < ExpCurve.children.length; i++) {
		var Level = ExpCurve.children[i];
		if (Level.name != null) {
			global.resources.tableExpCurve[Level.name.split("level")[1]] = Number(Level.attrs.exp);
		}
	}
}

function loadDefaultSlots() {
	console.log("[ResourcesLoad]:Loading DefaultSlots");

	var defaultSlotsObj = {};
	var default_slots = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/default_slots.xml")).getChildren("slot_def");
	for (cur_def_slot in default_slots) {
		defaultSlotsObj[default_slots[cur_def_slot].attrs.name] = { id: Number(default_slots[cur_def_slot].attrs.id), always_equip: Boolean(default_slots[cur_def_slot].attrs.always_equip) }
	}
	global.resources.defaultSlots = defaultSlotsObj;
}

function loadDefaultItems() {
	console.log("[ResourcesLoad]:Loading DefaultItems");

	var defaultItemsNamesObject = {};
	var defaultItemsArr = [];
	var elementDefaultItems = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/defaultitems.xml")).getChildren("item");

	var classesIdexesTable = ["R", "H", "S", "M", "E"];

	var itemId = 1;

	for (var i = 0; i < elementDefaultItems.length; i++) {
		var itemInfoAttrs = elementDefaultItems[i].attrs;

		var itemEquipped = 0;

		var itemName = itemInfoAttrs.name;
		if (!itemName) errorBadAttr("loadDefaultItems", "name", "item");

		var itemClasses = itemInfoAttrs.classes;
		if (!itemClasses) errorBadAttr("loadDefaultItems", "classes", "item");

		//var m_slotForClass = [0, 0, 0, 0, 0];
		var itemSlot = 0;

		var itemClassesArr = itemClasses.split(";");
		for (var c = 0; c < itemClassesArr.length; c++) {
			if (!itemClassesArr[c]) continue;

			var itemClassName = itemClassesArr[c].split(":")[0];
			if (!itemClassName) errorBadAttr("loadDefaultItems", "itemClassName", "classes");

			var itemClassSlot = itemClassesArr[c].split(":")[1];
			if (!itemClassSlot) errorBadAttr("loadDefaultItems", "itemClassSlot", "classes");

			var itemSlotInfo = global.resources.defaultSlots[itemClassSlot];
			if (!itemSlotInfo) {
				console.log("[loadDefaultItems]:Failed to find slot by type '" + itemClassSlot + "'");
				throw "";
			}

			var itemSlotId = itemSlotInfo.id;

			var itemClassIndex = classesIdexesTable.indexOf(itemClassName);
			if (itemClassIndex == -1) {
				console.log("[loadDefaultItems]:Failed to find index by class '" + itemClassName + "'");
				throw "";
			}

			itemEquipped += (1 << itemClassIndex);

			//m_slotForClass[itemClassIndex] = itemSlotId;
			itemSlot += Math.pow((1 << itemClassIndex), 5) * itemSlotId;

			if (!defaultItemsNamesObject[itemClassIndex]) {
				defaultItemsNamesObject[itemClassIndex] = {};
			}

			defaultItemsNamesObject[itemClassIndex][itemSlotId] = itemName;
		}

		//var itemSlot = (m_slotForClass[0] & 0x3F | ((m_slotForClass[1] & 0x3F | ((((m_slotForClass[3] & 0x3F | ((m_slotForClass[4] & 0x3F) << 6)) << 6) | m_slotForClass[2] & 0x3F) << 6)) << 6) | 0x40000000);

		defaultItemsArr.push({ id: itemId, name: itemName, attached_to: "0", config: "dm=0;material=default", slot: itemSlot, equipped: itemEquipped, default: 1 });
		itemId++;
	}
	global.resources.defaultItems = defaultItemsArr;
	global.resources.defaultItemsNames = defaultItemsNamesObject;
}

function loadGameModesConfig() {
	console.log("[ResourcesLoad]:Loading GameModesConfig");

	var gmcJson = {};

	function gmcSetSetting(modeName, roomType, settingName, newValue) {

		if (!gmcJson[modeName]) {
			gmcJson[modeName] = { settings: {}, restrictions: {} };
		}

		if (!gmcJson[modeName].settings[settingName]) {
			gmcJson[modeName].settings[settingName] = {};
		}

		gmcJson[modeName].settings[settingName][roomType] = newValue;
	}

	function gmcSetRestriction(modeName, roomType, restrictionName, newValue) {

		if (!gmcJson[modeName]) {
			gmcJson[modeName] = { settings: {}, restrictions: {} };
		}

		if (!gmcJson[modeName].restrictions[restrictionName]) {
			gmcJson[modeName].restrictions[restrictionName] = {};
		}

		gmcJson[modeName].restrictions[restrictionName][roomType] = newValue;
	}

	var elementGameModesConfig = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/game_modes_config.xml", "utf8"));

	var elementRestrictionOptions = elementGameModesConfig.getChild("restriction_options");

	var elementsRestriction = elementRestrictionOptions.getChildElements();

	function gmcParseXmlBlock(elementData, modeName, roomType) {

		var elementSettings = elementData.getChild("settings");

		if (elementSettings) {
			var elementSettingArr = elementSettings.getChildren("setting");
			for (var i = 0; i < elementSettingArr.length; i++) {
				var elemntSettingAttrs = elementSettingArr[i].attrs;
				gmcSetSetting(modeName, roomType, elemntSettingAttrs.kind, elemntSettingAttrs.value);
			}
		}

		function gmcParseXmlBlockRestrictionElement(elemntRestrictionAttrs) {

			var elementRestriction = elementRestrictionOptions.getChildByAttr("kind", elemntRestrictionAttrs.kind);
			if (!elementRestriction) {
				console.log("[ResourcesLoad][LoadGameModesConfig]:Failed to find restriction '" + elemntRestrictionAttrs.kind + "'");
				throw "";
			}

			var elementRestrictionOption = elementRestriction.getChildByAttr("id", elemntRestrictionAttrs.option);
			if (!elementRestrictionOption) {
				console.log("[ResourcesLoad][LoadGameModesConfig]:Failed to find option '" + elemntRestrictionAttrs.option + "' in restriction '" + elemntRestrictionAttrs.kind + "'");
				throw "";
			}

			var allowedsArr = [];
			var elementRestrictionOptionAllowsArr = elementRestrictionOption.getChildren("allowed");
			for (var a = 0; a < elementRestrictionOptionAllowsArr.length; a++) {
				var eValue = elementRestrictionOptionAllowsArr[a].attrs.value;
				//if (elemntRestrictionAttrs.kind == "inventory_slot") {
				//	eValue = scriptTools.getInventorySlotNumberFromString(eValue);
				//}
				allowedsArr.push(eValue);
			}

			var eDefaultValue = elementRestrictionOption.attrs.default;
			//if (elemntRestrictionAttrs.kind == "inventory_slot") {
			//	eDefaultValue = scriptTools.getInventorySlotNumberFromString(eDefaultValue);
			//}

			var restrictionObject = { allowed: allowedsArr, default: eDefaultValue };

			if (elementRestriction.attrs.channels) {
				restrictionObject.channels = elementRestriction.attrs.channels.split(" ").join("").split(",");
			} else {
				restrictionObject.channels = ["pve"];
			}

			if (elementRestriction.attrs.on_room_creation_only) {
				restrictionObject.on_room_creation_only = elementRestriction.attrs.on_room_creation_only;
			}

			gmcSetRestriction(modeName, roomType, elemntRestrictionAttrs.kind, restrictionObject);
		}

		var elementRestrictions = elementData.getChild("restrictions");

		if (elementRestrictions) {
			var elementRestrictionArr = elementRestrictions.getChildren("restriction");
			for (var i = 0; i < elementRestrictionArr.length; i++) {
				gmcParseXmlBlockRestrictionElement(elementRestrictionArr[i].attrs);
			}
		}

		for (var i = 0; i < elementsRestriction.length; i++) {

			var elementRestriction = elementsRestriction[i];

			if (elementRestriction.attrs.is_global != "1") {
				continue;
			}

			var elementOption = elementRestriction.getChild("option");

			if (!elementOption) {
				continue;
			}

			gmcParseXmlBlockRestrictionElement({ kind: elementRestriction.attrs.kind, option: elementOption.attrs.id });
		}

	}

	var gmcRoomTypes = {
		"PvE_Private": "1",
		"PvP_Public": "2",
		"PvP_ClanWar": "4",
		"PvP_Autostart": "8",
		"PvE_Autostart": "16",
		"PvP_Rating": "32"
	}

	function gmcParseRoomXmlBlock(elementData, modeName) {
		var elementRoomArr = elementData.getChildren("room");
		for (var i = 0; i < elementRoomArr.length; i++) {
			var elementRoom = elementRoomArr[i];
			var roomType = gmcRoomTypes[elementRoom.attrs.type];

			if (!roomType) {
				console.log("[ResourcesLoad][LoadGameModesConfig]:Failed to find roomType '" + elementRoom.attrs.type + "'");
				throw "";
			}

			gmcParseXmlBlock(elementRoom, modeName, roomType);
		}
	}

	var elementGameModesConfigGameModes = elementGameModesConfig.getChild("game_modes");
	if (!elementGameModesConfigGameModes) {
		elementGameModesConfigGameModes = elementGameModesConfig.c("game_modes");
		var gamemodesPathsArr = getFiles("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/gamemodes");
		for (var i = 0; i < gamemodesPathsArr.length; i++) {
			var gamemodeElement = ltx.parse(fs.readFileSync(gamemodesPathsArr[i]));
			elementGameModesConfigGameModes.children.push(gamemodeElement);
		}
	}

	var elementDefaultSettings = elementGameModesConfig.getChild("global_settings");

	var elementForArr = elementGameModesConfigGameModes.getChildren("for");
	for (var i = 0; i < elementForArr.length; i++) {
		var elementFor = elementForArr[i];

		if (elementDefaultSettings) {
			gmcParseRoomXmlBlock(elementDefaultSettings, elementFor.attrs.mode);
		}
		gmcParseXmlBlock(elementFor, elementFor.attrs.mode, "-1");
		gmcParseRoomXmlBlock(elementFor, elementFor.attrs.mode);
	}

	global.resources.configGameModes = gmcJson;
	//console.log(global.resources.configGameModes.tdm.restrictions);
}

function loadRewardsConfiguration() {
	console.log("[ResourcesLoad]:Loading RewardsConfiguration");

	global.resources.RewardsConfiguration = {
		"MoneyMultiplier": {
			"default": 0.6
		},
		"ExperienceMultiplier": {
			"default": 1
		},
		"SponsorPointsMultiplier": {
			"default": 1
		},
		"ClanPointsClanWarMultiplier": 1,
		"ClanPointsMultiplier": 0.1,
		"WinPoolDefault": 100,
		"LosePoolDefault": 25,
		"DrawPoolDefault": 35,
		"ScorePoolDefault": 0,
		"MinReward": 5,
		"SecondaryObjectiveBonus": 10,
		"BonusRewardPool": {},
		"player_count_reward_mults": [],
		"CrownRewards": {}
	};

	var fileRewardsConfiguration

	try {
		fileRewardsConfiguration = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/rewards_configuration.xml");
	} catch (e) {
		console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to open file 'rewards_configuration.xml'");
		throw "";
	}

	var elementRewardsConfiguration;

	try {
		elementRewardsConfiguration = ltx.parse(fileRewardsConfiguration);
	} catch (e) {
		console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse file 'rewards_configuration.xml'");
		throw "";
	}

	var elementRewards = elementRewardsConfiguration.getChild("Rewards");

	if (!elementRewards) {
		console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to get element 'Rewards' in 'rewards_configuration.xml'");
		throw "";
	}

	var arrElementsName = [];

	var elementsReward = elementRewards.getChildElements();

	for (var i = 0; i < elementsReward.length; i++) {

		var elementReward = elementsReward[i];

		arrElementsName.push(elementReward.name);

		if (elementReward.name == "MoneyMultiplier" || elementReward.name == "ExperienceMultiplier" || elementReward.name == "SponsorPointsMultiplier") {

			var elementsMultiplier = elementReward.getChildElements();

			if (elementsMultiplier.length != 0) {

				for (var e = 0; e < elementsMultiplier.length; e++) {

					var elementMultiplier = elementsMultiplier[e];

					var numberMultiplier = Number(elementMultiplier.getText());

					if (Number.isNaN(numberMultiplier)) {
						console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse text in element '" + elementMultiplier.name + "' in element '" + elementReward.name + "' in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
						throw "";
					}

					global.resources.RewardsConfiguration[elementReward.name][elementMultiplier.name] = numberMultiplier;
				}

				continue;
			}

			var numberMultiplier = Number(elementReward.getText());

			if (Number.isNaN(numberMultiplier)) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse text in element '" + elementReward.name + "' in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			global.resources.RewardsConfiguration[elementReward.name]["default"] = numberMultiplier;

			continue;
		}

		if (elementReward.name == "ClanPointsClanWarMultiplier" || elementReward.name == "ClanPointsMultiplier" || elementReward.name == "WinPoolDefault" || elementReward.name == "LosePoolDefault" || elementReward.name == "DrawPoolDefault" || elementReward.name == "ScorePoolDefault" || elementReward.name == "MinReward" || elementReward.name == "SecondaryObjectiveBonus") {

			var numberMultiplier = Number(elementReward.getText());

			//TODO
			if(numberMultiplier == 0 && elementReward.name == "ClanPointsMultiplier"){
				numberMultiplier = 0.1;
			}

			if (Number.isNaN(numberMultiplier)) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse text in element '" + elementReward.name + "' in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			global.resources.RewardsConfiguration[elementReward.name] = numberMultiplier;

			continue;
		}

		if (elementReward.name == "BonusRewardPool") {

			var attributeMissionType = elementReward.attrs.mission_type;

			if (!attributeMissionType) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse attribute 'mission_type' in element '" + elementReward.name + "' in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			var attributeValue = Number(elementReward.attrs.value);

			if (Number.isNaN(attributeValue)) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse attribute 'value' in element '" + elementReward.name + "' in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			global.resources.RewardsConfiguration[elementReward.name][attributeMissionType] = attributeValue;

			continue;
		}

		if (elementReward.name == "player_count_reward_mults") {

			var elementsValue = elementReward.getChildren("Value");

			for (var e = 0; e < elementsValue.length; e++) {

				var elementValue = elementsValue[e];

				var numberValue = Number(elementValue.getText());

				if (Number.isNaN(numberValue)) {
					console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse text in element '" + elementValue.name + "' in element '" + elementReward.name + "' in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
					throw "";
				}

				global.resources.RewardsConfiguration[elementReward.name].push(numberValue);
			}

			continue;
		}
	}

	if (arrElementsName.indexOf("MoneyMultiplier") == -1 || arrElementsName.indexOf("ExperienceMultiplier") == -1 || arrElementsName.indexOf("SponsorPointsMultiplier") == -1 || arrElementsName.indexOf("WinPoolDefault") == -1 || arrElementsName.indexOf("LosePoolDefault") == -1 || arrElementsName.indexOf("DrawPoolDefault") == -1 || arrElementsName.indexOf("MinReward") == -1 || arrElementsName.indexOf("SecondaryObjectiveBonus") == -1) {
		console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to get required elements in element '" + elementRewards.name + "' in file 'rewards_configuration.xml'");
		throw "";
	}

	var elementCrownRewards = elementRewardsConfiguration.getChild("CrownRewards");

	if (elementCrownRewards) {

		var elementsReward = elementCrownRewards.getChildren("Reward");

		for (var e = 0; e < elementsReward.length; e++) {

			var elementReward = elementsReward[e];

			var attributeType = elementReward.attrs.type;

			if (!attributeType) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse attribute 'type' in element '" + elementReward.name + "' in element '" + elementCrownRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			var attributeBronze = Number(elementReward.attrs.bronze);

			if (Number.isNaN(attributeBronze)) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse attribute 'bronze' in element '" + elementReward.name + "' in element '" + elementCrownRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			var attributeSilver = Number(elementReward.attrs.silver);

			if (Number.isNaN(attributeSilver)) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse attribute 'silver' in element '" + elementReward.name + "' in element '" + elementCrownRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			var attributeGold = Number(elementReward.attrs.gold);

			if (Number.isNaN(attributeGold)) {
				console.log("[ResourcesLoad][loadRewardsConfiguration]: Failed to parse attribute 'gold' in element '" + elementReward.name + "' in element '" + elementCrownRewards.name + "' in file 'rewards_configuration.xml'");
				throw "";
			}

			global.resources.RewardsConfiguration[elementCrownRewards.name][attributeType] = { bronze: attributeBronze, silver: attributeSilver, gold: attributeGold };
		}
	}
}

function loadMissions() {
	console.log("[ResourcesLoad]:Loading Missions");

	var missionsObject = { uid: {}, name: {} };

	var missionsPathsArr = getFiles("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/missions");

	for (var i = 0; i < missionsPathsArr.length; i++) {
		var missionLtxParsed = ltx.parse(fs.readFileSync(missionsPathsArr[i], "utf-8"));

		removeTextFromLtxElements(missionLtxParsed);

		if (missionLtxParsed.attrs.release_mission == "1" && missionLtxParsed.attrs.game_mode != "pve") {
			missionsObject.uid[missionLtxParsed.attrs.uid] = missionLtxParsed;
			missionsObject.name[missionsPathsArr[i].split("/")[missionsPathsArr[i].split("/").length - 1].split(".")[0].toLowerCase()] = missionLtxParsed;
		}
	}
	global.resources.missions = missionsObject;
}

function loadQuickplayMaps() {
	console.log("[ResourcesLoad]:Loading QuickplayMaps");

	function createMapsArr(elementMaps, allowedMissionTypes, filterRating) {
		var resultArr = [];
		var elementMapsArr = elementMaps.getChildren("map");

		for (var i = 0; i < elementMapsArr.length; i++) {
			var mapInfoAttrs = elementMapsArr[i].attrs;

			var mapName = mapInfoAttrs.name.toLowerCase();

			if (mapName.indexOf("pvp/") == 0) {
				mapName = mapName.slice(4);
			}

			var mapElement = global.resources.missions.name[mapName];

			if (!mapElement || (allowedMissionTypes && allowedMissionTypes.indexOf(mapElement.attrs.game_mode) == -1) || mapElement.attrs.only_clan_war_mission == "1" || (filterRating && mapElement.attrs.rating_game_mission != "1")) {
				//console.log("[ResourcesLoad][loadQuickplayMaps][createMapsArr]:Skip '" + mapInfoAttrs.name);
				continue;
			}

			resultArr.push(mapElement.attrs.uid);
		}
		return resultArr;
	}

	var quickplayMapsObject = { autostartMaps: [], ratingGameMaps: [], cachedQuickplayMaplist: new ltx.Element("quickplay_maplist", { code: "3", from: "0", to: 0, hash: Math.round(new Date().getTime() / 1000) }) };

	var fileQuickplayMapsXml;

	try {
		fileQuickplayMapsXml = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/quickplay_maps.xml");
	} catch (e) {
		if (e.code != "ENOENT") {
			throw e;
		}
	}

	if (fileQuickplayMapsXml) {

		var elementQuickplayMaps = ltx.parse(fileQuickplayMapsXml);

		var channelTypes = {
			"pvp_newbie": "PvP_Newbie",
			"pvp_skilled": "PvP_Skilled",
			"pvp_pro": "PvP_Pro"
		}

		var channelType = channelTypes[global.startupParams.channel];
		if (!channelType) {
			//console.log("[ResourcesLoad][loadQuickplayMaps]:Channel type '" + global.startupParams.channel + "' is not found");
			global.resources.quickplayMaps = quickplayMapsObject;
			return;
		}

		var elementChannel = elementQuickplayMaps.getChildByAttr("type", channelType);
		if (!elementChannel) errorGetChild("loadQuickplayMaps", "channel", "quickplay");

		quickplayMapsObject.autostartMaps = createMapsArr(elementChannel, null, false);

		var elementAutostartMaps = elementChannel.getChild("autostart_maps");

		if (elementAutostartMaps) {
			quickplayMapsObject.autostartMaps = createMapsArr(elementAutostartMaps, null, false);
		}

		var elementRatingGameMaps = elementChannel.getChild("rating_game_maps");

		if (elementRatingGameMaps) {
			quickplayMapsObject.ratingGameMaps = createMapsArr(elementRatingGameMaps, ["ptb", "ctf"], true);
		}

		for (var i = 0; i < quickplayMapsObject.autostartMaps.length; i++) {
			quickplayMapsObject.cachedQuickplayMaplist.c("map", { mission: quickplayMapsObject.autostartMaps[i], population: 0 });
			quickplayMapsObject.cachedQuickplayMaplist.attrs.to++;
		}

	}

	global.resources.quickplayMaps = quickplayMapsObject;
}

function loadAchievementsList() {
	console.log("[ResourcesLoad]:Loading AchievementsList");

	var achievementsArr = [];
	var AchievementDesc = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/achievementdesc.xml"));
	
	var LocalizationObj = {};

	/*
	var AchievementLocalization = ltx.parse(fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/languages/text_achievements.xml"));
	
	var AchievementLocalizationTableC = AchievementLocalization.getChild("Worksheet").getChild("Table").getChildren("Row");

	for (var i = 0; i < AchievementLocalizationTableC.length; i++) {
		var AchievementRow = AchievementLocalizationTableC[i];
		var AchievementCells = AchievementRow.getChildren("Cell");
		var AchievementCellLocalize = AchievementCells[1];
		var AchievementCellTraslateEn = AchievementCells[2];
		var AchievementCellTraslate = AchievementCells[3];
		if (AchievementCellLocalize != null && AchievementCellTraslateEn != null && AchievementCellTraslate != null) {
			var AchievementCellLocalizeData = AchievementCellLocalize.getChild("Data");
			var AchievementCellTraslateData = AchievementCellTraslate.getChild("Data");
			var AchievementCellTraslateEnData = AchievementCellTraslateEn.getChild("Data");
			if (AchievementCellLocalizeData != null && AchievementCellTraslateEnData != null && AchievementCellTraslateData != null) {
				var AchievementCellLocalizeDataText = AchievementCellLocalizeData.getText();
				var AchievementCellTraslateEnDataText = AchievementCellTraslateEnData.getText();
				var AchievementCellTraslateDataText = AchievementCellTraslateData.getText();
				var AchievementTranslate = AchievementCellTraslateDataText;
				if (AchievementTranslate == " ") {
					AchievementTranslate = AchievementCellTraslateEnDataText;
				}
				LocalizationObj["@" + AchievementCellLocalizeDataText] = AchievementTranslate;
			}
		}
	}
	*/
	
	var achievementsPathsArr = getFiles("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/achievements");

	for (var i = 0; i < achievementsPathsArr.length; i++) {
		AchievementDesc.children.push(ltx.parse(fs.readFileSync(achievementsPathsArr[i], "utf-8")));
	}

	//Создание обьекта с информацией о достяжениях
	var AchievementC = AchievementDesc.getChildren("Achievement");

	for (var i = 0; i < AchievementC.length; i++) {
		var Achievement = AchievementC[i];
		var AchievementUiName = Achievement.getChild("UI").attrs.name;
		var LocalizeUiName = "Нет локализации";
		if (LocalizationObj[AchievementUiName] != null) {
			LocalizeUiName = LocalizationObj[AchievementUiName];
		}

		achievementsArr.push({ id: Number(Achievement.attrs.id), amount: Number(Achievement.attrs.amount), name: LocalizeUiName });
	}

	global.resources.achievementsArr = achievementsArr;
}

function loadSpecialRewardConfiguration() {

	console.log("[ResourcesLoad]:Loading SpecialRewardConfiguration");

	var objectSpecialRewardConfiguration = {};

	var fileSpecialRewardConfigurationXml;

	try {
		fileSpecialRewardConfigurationXml = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/special_reward_configuration.xml");
	} catch (e) {
		if (e.code != "ENOENT") {
			throw e;
		}
	}

	if (fileSpecialRewardConfigurationXml) {

		var elementSpecialRewardConfiguration = ltx.parse(fileSpecialRewardConfigurationXml);

		var elementsEvent = elementSpecialRewardConfiguration.getChildren("event");

		for (var i = 0; i < elementsEvent.length; i++) {

			var elementEvent = elementsEvent[i];

			if (!elementEvent.attrs.name) {
				console.log("[ResourcesLoad][LoadSpecialRewardConfiguration][Event]:Attribute 'name' is missing!");
				throw "";
			}

			var rewardsArr = [];
			var originalArr = [];

			var elementsChild = elementEvent.getChildElements();

			for (var e = 0; e < elementsChild.length; e++) {
				var elementChild = elementsChild[e];

				switch (elementChild.name) {
					case "item":

						var itemDurabilityPoints = Number(elementChild.attrs.durability);
						if (Number.isNaN(itemDurabilityPoints) == true) {
							itemDurabilityPoints = 0;
						}

						var itemExpirationTime = elementChild.attrs.expiration;
						if (itemExpirationTime != null && itemExpirationTime != "" && itemExpirationTime != "0") {
							var timeUnit = itemExpirationTime[itemExpirationTime.length - 1];
							var timeCount = itemExpirationTime.slice(0, -1);
							switch (timeUnit) {
								case "d":
									itemExpirationTime = timeCount + " day";
									break;
								case "h":
									itemExpirationTime = timeCount + " hour";
									break;
								case "m":
									itemExpirationTime = timeCount + " month";
									break;
								default:
									console.log("[ResourcesLoad][LoadSpecialRewardConfiguration]:Item '" + itemName + "' timeUnit: '" + timeUnit + "' is unknown!");
									throw "";
							}

						} else {
							itemExpirationTime = "";
						}

						var itemQuantity = Number(elementChild.attrs.amount);
						if (Number.isNaN(itemQuantity) == true) {
							itemQuantity = 0;
						}

						var globalItemInfo = global.resources.items.data[global.resources.items.data.findIndex(function (x) { return x.name == elementChild.attrs.name; })];

						if (!globalItemInfo) {
							console.log("[ResourcesLoad][LoadSpecialRewardConfiguration]:Item '" + elementChild.attrs.name + "' is not found!");
							throw "";
						}

						rewardsArr.push({ name: elementChild.attrs.name, durabilityPoints: itemDurabilityPoints, expirationTime: itemExpirationTime, quantity: itemQuantity });
						break;
					case "money":

						var itemMoneyName;

						switch (elementChild.attrs.currency) {
							case "game_money":
								itemMoneyName = "game_money_item_01";
								break;
						}

						if (!itemMoneyName) {
							console.log("[ResourcesLoad][LoadSpecialRewardConfiguration]:CurrencyType '" + elementChild.attrs.currency + "' is unknown!");
							throw "";
						}

						var itemQuantity = Number(elementChild.attrs.amount);
						if (Number.isNaN(itemQuantity) == true) {
							itemQuantity = 0;
						}

						rewardsArr.push({ name: itemMoneyName, durabilityPoints: 0, expirationTime: "", quantity: itemQuantity, offerId: 0 });
						break;
					case "achievement":
						break;
					case "reserve_item":
						break;
					default:
						console.log("[ResourcesLoad][LoadSpecialRewardConfiguration]:RewardType '" + elementChild.name + "' is unknown!");
						throw "";
				}
				originalArr.push(elementChild);
			}

			objectSpecialRewardConfiguration[elementEvent.attrs.name] = { use_notification: Number(elementEvent.attrs.use_notification), rewards: rewardsArr, original: originalArr };
		}

	}

	global.resources.objectSpecialRewardConfiguration = objectSpecialRewardConfiguration;
}

function loadProfileProgressionConfig() {

	console.log("[ResourcesLoad]:Loading ProfileProgressionConfig");

	var objectProfileProgressionConfig = {
		class_unlock: {
			tutorial_passed: {
				"tutorial_2": "medic",
				"tutorial_3": "engineer",
			}
		},
		tutorial_passed: {
			"tutorial_1": "tutorial_1_completed",
			"tutorial_2": "tutorial_2_completed",
			"tutorial_3": "tutorial_3_completed",
		},
		configsCache: null
	};

	var fileProfileProgressionConfigXml;

	try {
		fileProfileProgressionConfigXml = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/profile_progression_config.xml");
	} catch (e) {
		if (e.code != "ENOENT") {
			throw e;
		}
	}

	if (fileProfileProgressionConfigXml) {

		var elementProfileProgressionConfig = ltx.parse(fileProfileProgressionConfigXml);

		if (!elementProfileProgressionConfig.attrs.enabled) {
			console.log("[ResourcesLoad][LoadProfileProgressionConfig]:Attribute 'enabled' is missing!");
			throw "";
		}

		if (elementProfileProgressionConfig.attrs.enabled != "0" && elementProfileProgressionConfig.attrs.enabled != "1") {
			console.log("[ResourcesLoad][LoadProfileProgressionConfig]:Attribute 'enabled' is incorrect!");
			throw "";
		}

		var elementProfileGroup = elementProfileProgressionConfig.getChild("profile_group");

		if (elementProfileGroup) {
			elementProfileProgressionConfig.children = [...elementProfileProgressionConfig.children, ...elementProfileGroup.children];
		}

		var elementNewProfileProgressionConfig = new ltx.Element("profile_progression_config", { enabled: elementProfileProgressionConfig.attrs.enabled });

		for (var i = 0; i < elementProfileProgressionConfig.children.length; i++) {

			if (!elementProfileProgressionConfig.children[i].name || elementProfileProgressionConfig.children[i].name == "profile_group") {
				continue;
			}

			elementNewProfileProgressionConfig.children.push(elementProfileProgressionConfig.children[i]);
		}

		objectProfileProgressionConfig.configsCache = elementNewProfileProgressionConfig;

		/*
	
		objectProfileProgressionConfig = { class_unlock: { tutorial_passed: {} }, tutorial_passed: {} };
	
		var attrEnabled = elementProfileProgressionConfig.attrs.enabled;
		if (!attrEnabled) {
			console.log("[ResourcesLoad][LoadProfileProgressionConfig]:Attribute 'enabled' is missing!");
			throw "";
		}
	
		if (attrEnabled == "0") {
			console.log("[ResourcesLoad][LoadProfileProgressionConfig]:Loading ProfileProgressionConfig is skipped, enabled == 0");
			return;
		}
	
		var elementProfileGroup = elementProfileProgressionConfig.getChild("profile_group");
	
		if (elementProfileGroup) {
			elementProfileProgressionConfig.children = [...elementProfileProgressionConfig.children, ...elementProfileGroup.children];
		}
	
		var elementsClassUnlock = elementProfileProgressionConfig.getChildren("class_unlock");
		for (var i = 0; i < elementsClassUnlock.length; i++) {
	
			var elementClassUnlock = elementsClassUnlock[i];
	
			if (!elementClassUnlock.attrs.tutorial_passed) {
				console.log("[ResourcesLoad][LoadProfileProgressionConfig][ClassUnlock]:Attribute 'tutorial_passed' is missing!");
				//throw "";
				continue;
			}
	
			if (!elementClassUnlock.attrs.unlock_class) {
				console.log("[ResourcesLoad][LoadProfileProgressionConfig][ClassUnlock]:Attribute 'unlock_class' is missing!");
				throw "";
			}
	
			objectProfileProgressionConfig.class_unlock.tutorial_passed[elementClassUnlock.attrs.tutorial_passed] = elementClassUnlock.attrs.unlock_class;
		}
	
		var elementsTutorialPassed = elementProfileProgressionConfig.getChildren("tutorial_passed");
		for (var i = 0; i < elementsTutorialPassed.length; i++) {
	
			var elementTutorialPassed = elementsTutorialPassed[i];
	
			if (!elementTutorialPassed.attrs.type) {
				console.log("[ResourcesLoad][LoadProfileProgressionConfig][TutorialPassed]:Attribute 'type' is missing!");
				throw "";
			}
	
			if (!elementTutorialPassed.attrs.special_reward) {
				console.log("[ResourcesLoad][LoadProfileProgressionConfig][TutorialPassed]:Attribute 'special_reward' is missing!");
				throw "";
			}
	
			objectProfileProgressionConfig.tutorial_passed[elementTutorialPassed.attrs.type] = elementTutorialPassed.attrs.special_reward;
		}
	
		*/

	}

	global.resources.objectProfileProgressionConfig = objectProfileProgressionConfig;
}

function loadCustomRules() {
	console.log("[ResourcesLoad]:Loading CustomRules");

	var objectCustomRules = { scheduled_reward: {}, progression_reward: {}, consecutive_login_bonus: [], dynamic_items: {}, reward_multiplier: {}, mission_reward: {} };

	var fileCustomRulesXml;

	try {
		fileCustomRulesXml = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/custom_rules.xml");
	} catch (e) {
		if (e.code != "ENOENT") {
			throw e;
		}
	}

	if (fileCustomRulesXml) {

		var elementCustomRules = ltx.parse(fileCustomRulesXml);

		var elementsMissionReward = elementCustomRules.getChildren("mission_reward");
		for (var i = 0; i < elementsMissionReward.length; i++) {

			var elementMissionReward = elementsMissionReward[i];

			if (!elementMissionReward.attrs.enabled) {
				console.log("[ResourcesLoad][LoadCustomRules][MissionReward]:Attribute 'enabled' is missing!");
				throw "";
			}

			if (!elementMissionReward.attrs.mission_type) {
				console.log("[ResourcesLoad][LoadCustomRules][MissionReward]:Attribute 'mission_type' is missing!");
				throw "";
			}

			if (!elementMissionReward.attrs.reward_set) {
				console.log("[ResourcesLoad][LoadCustomRules][MissionReward]:Attribute 'reward_set' is missing!");
				throw "";
			}

			if (elementMissionReward.attrs.enabled != "0" && elementMissionReward.attrs.enabled != "1") {
				console.log("[ResourcesLoad][LoadCustomRules][MissionReward]:Attribute 'enabled' is incorrect!");
				throw "";
			}

			if (elementMissionReward.attrs.enabled == "0") {
				continue;
			}

			//mission_type

			if (!global.resources.objectSpecialRewardConfiguration[elementMissionReward.attrs.reward_set]) {
				console.log("[ResourcesLoad][LoadCustomRules][MissionReward]:Attribute 'reward_set' is incorrect!");
				throw "";
			}

			objectCustomRules.mission_reward[elementMissionReward.attrs.mission_type] = elementMissionReward.attrs.reward_set;
		}

		var elementConsecutiveLoginBonus = elementCustomRules.getChild("consecutive_login_bonus");

		if (elementConsecutiveLoginBonus) {

			if (!elementConsecutiveLoginBonus.attrs.enabled) {
				console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonus]:Attribute 'enabled' is missing!");
				throw "";
			}

			if (elementConsecutiveLoginBonus.attrs.enabled == "1") {

				var elementStreak = elementConsecutiveLoginBonus.getChild("streak");

				if (!elementStreak) {
					console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonus]:Element 'streak' is missing!");
					throw "";
				}

				var elementsReward = elementStreak.getChildren("reward");

				if (!elementsReward.length) {
					console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonus][Streak]:Elements 'reward' is missing!");
					throw "";
				}

				for (var e = 0; e < elementsReward.length; e++) {

					var elementRewardText;

					if (elementsReward[e].getText()) {
						elementRewardText = elementsReward[e].getText();
					}

					if (elementsReward[e].attrs.name) {
						elementRewardText = elementsReward[e].attrs.name;
					}

					if (!elementRewardText) {
						console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonus][Streak][Reward]:Text is missing!");
						throw "";
					}

					objectCustomRules.consecutive_login_bonus.push(elementRewardText);
				}

			}

		}

		var elementConsecutiveLoginBonusHoliday = elementCustomRules.getChild("consecutive_login_bonus_holiday");

		if (elementConsecutiveLoginBonusHoliday) {

			if (!elementConsecutiveLoginBonusHoliday.attrs.enabled) {
				console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonusHoliday]:Attribute 'enabled' is missing!");
				throw "";
			}

			if (elementConsecutiveLoginBonusHoliday.attrs.enabled == "1") {

				var elementStreak = elementConsecutiveLoginBonusHoliday.getChild("streak");

				if (!elementStreak) {
					console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonusHoliday]:Element 'streak' is missing!");
					throw "";
				}

				var elementsReward = elementStreak.getChildren("reward");

				if (!elementsReward.length) {
					console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonusHoliday][Streak]:Elements 'reward' is missing!");
					throw "";
				}

				for (var e = 0; e < elementsReward.length; e++) {

					var elementRewardText = elementsReward[e].getText();

					if (!elementRewardText) {
						console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonusHoliday][Streak][Reward]:Text is missing!");
						throw "";
					}

					objectCustomRules.consecutive_login_bonus.push(elementRewardText);
				}

			}

		}

		//consecutive_login_bonus_holiday

		var elementsProgressionReward = elementCustomRules.getChildren("progression_reward");

		for (var i = 0; i < elementsProgressionReward.length; i++) {

			var elementProgressionReward = elementsProgressionReward[i];

			if (!elementProgressionReward.attrs.enabled) {
				console.log("[ResourcesLoad][LoadCustomRules][ProgressionReward]:Attribute 'enabled' is missing!");
				throw "";
			}

			if (!elementProgressionReward.attrs.rank) {
				console.log("[ResourcesLoad][LoadCustomRules][ProgressionReward]:Attribute 'rank' is missing!");
				throw "";
			}

			if (!elementProgressionReward.attrs.reward_set) {
				console.log("[ResourcesLoad][LoadCustomRules][ProgressionReward]:Attribute 'reward_set' is missing!");
				throw "";
			}

			if (elementProgressionReward.attrs.enabled != "0" && elementProgressionReward.attrs.enabled != "1") {
				console.log("[ResourcesLoad][LoadCustomRules][ProgressionReward]:Attribute 'enabled' is incorrect!");
				throw "";
			}

			if (elementProgressionReward.attrs.enabled == "0") {
				continue;
			}

			//rank

			if (!global.resources.objectSpecialRewardConfiguration[elementProgressionReward.attrs.reward_set]) {
				console.log("[ResourcesLoad][LoadCustomRules][ProgressionReward]:Attribute 'reward_set' is incorrect!");
				throw "";
			}

			objectCustomRules.progression_reward[elementProgressionReward.attrs.rank] = elementProgressionReward.attrs.reward_set;
		}

	}

	global.resources.objectCustomRules = objectCustomRules;
}

function loadRatingCurve() {
	console.log("[ResourcesLoad]:Loading RatingCurve");

	var fileRatingCurveXml;

	try {
		fileRatingCurveXml = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.ver + "/libs/config/masterserver/rating_curve.xml");
	} catch (e) {
		if (e.code != "ENOENT") {
			throw e;
		}
	}

	if (fileRatingCurveXml) {

		var elementCurve = ltx.parse(fileRatingCurveXml);

		if (!elementCurve.attrs.step) {
			console.log("[ResourcesLoad][LoadRatingCurve][Curve]:Attribute 'step' is missing!");
			throw "";
		}

		if (!elementCurve.attrs.top_rating_capacity) {
			console.log("[ResourcesLoad][LoadRatingCurve][Curve]:Attribute 'top_rating_capacity' is missing!");
			throw "";
		}

		var elementsRating = elementCurve.getChildren("rating");

		var objectRatingCurve = { step: Number(elementCurve.attrs.step), top_rating_capacity: Number(elementCurve.attrs.top_rating_capacity), ratings: [] };

		for (var i = 0; i < elementsRating.length; i++) {

			var elementRating = elementsRating[i];

			if (!elementRating.attrs.points_required) {
				console.log("[ResourcesLoad][LoadRatingCurve][Rating]:Attribute 'points_required' is missing!");
				throw "";
			}

			if (!elementRating.attrs.adjustment) {
				console.log("[ResourcesLoad][LoadRatingCurve][Rating]:Attribute 'adjustment' is missing!");
				throw "";
			}

			if (!elementRating.attrs.icon) {
				console.log("[ResourcesLoad][LoadRatingCurve][Rating]:Attribute 'icon' is missing!");
				throw "";
			}

			if (!elementRating.attrs.description) {
				console.log("[ResourcesLoad][LoadRatingCurve][Rating]:Attribute 'description' is missing!");
				throw "";
			}

			objectRatingCurve.ratings.push({ points_required: Number(elementRating.attrs.points_required), adjustment: Number(elementRating.attrs.adjustment), icon: elementRating.attrs.icon, description: elementRating.attrs.description });
		}


		global.resources.objectRatingCurve = objectRatingCurve;
	}
}

function loadConfigs() {

	console.log("[ResourcesLoad]:Loading Configs");

	var configsArr = [];

	var elementAbuseManagerConfig = new ltx.Element("abuse_manager_config");
	var elementReportTypes = elementAbuseManagerConfig.c("report_types");

	for (var i = 0; i < global.config.abuse_manager_config.length; i++) {
		var reportType = global.config.abuse_manager_config[i];
		elementReportTypes.c("report_type", { message: "@ui_abuse_" + reportType, name: reportType });
	}

	configsArr.push(elementAbuseManagerConfig);

	var elementConsecutiveLoginBonus = new ltx.Element("consecutive_login_bonus", { enabled: "0" });

	if (global.resources.objectCustomRules.consecutive_login_bonus.length) {

		elementConsecutiveLoginBonus.attrs.enabled = "1";

		var elementStreak = elementConsecutiveLoginBonus.c("streak");

		for (var i = 0; i < global.resources.objectCustomRules.consecutive_login_bonus.length; i++) {
			elementStreak.c("reward", { name: global.resources.objectCustomRules.consecutive_login_bonus[i] }).children.push(global.resources.objectCustomRules.consecutive_login_bonus[i]);
		}

	}

	configsArr.push(elementConsecutiveLoginBonus);

	var elementSpecialRewardConfiguration = new ltx.Element("special_reward_configuration");

	for (var key in global.resources.objectSpecialRewardConfiguration) {

		var eventObject = global.resources.objectSpecialRewardConfiguration[key];

		var elementEvent = elementSpecialRewardConfiguration.c("event", { name: key });

		for (var i = 0; i < eventObject.original.length; i++) {
			elementEvent.children.push(eventObject.original[i]);
		}
	}

	configsArr.push(elementSpecialRewardConfiguration);

	if (global.resources.objectProfileProgressionConfig.configsCache) {
		configsArr.push(global.resources.objectProfileProgressionConfig.configsCache);
	}

	var resourcesObjectRatingCurve = global.resources.objectRatingCurve;

	if (resourcesObjectRatingCurve) {

		var elementRatingCurve = new ltx.Element("rating_curve", { step: resourcesObjectRatingCurve.step, top_rating_capacity: resourcesObjectRatingCurve.top_rating_capacity });

		for (var i = 0; i < resourcesObjectRatingCurve.ratings.length; i++) {

			var ratingObject = resourcesObjectRatingCurve.ratings[i];

			elementRatingCurve.c("rating", { points_required: ratingObject.points_required, adjustment: ratingObject.adjustment, icon: ratingObject.icon, description: ratingObject.description });
		}

		configsArr.push(elementRatingCurve);
	}

	var elementRegions = ltx.parse(`<regions default_region='petersburg'>
	<distances>
	<distance from='krasnodar' to='moscow' value='20'/>
	<distance from='novosibirsk' to='moscow' value='50'/>
	<distance from='ekaterinburg' to='moscow' value='30'/>
	<distance from='vladivostok' to='moscow' value='110'/>
	<distance from='khabarovsk' to='moscow' value='110'/>
	<distance from='novosibirsk' to='ekaterinburg' value='20'/>
	<distance from='novosibirsk' to='vladivostok' value='180'/>
	<distance from='novosibirsk' to='khabarovsk' value='150'/>
	<distance from='novosibirsk' to='krasnodar' value='70'/>
	<distance from='vladivostok' to='ekaterinburg' value='160'/>
	<distance from='vladivostok' to='khabarovsk' value='12'/>
	<distance from='vladivostok' to='krasnodar' value='135'/>
	<distance from='ekaterinburg' to='khabarovsk' value='140'/>
	<distance from='ekaterinburg' to='krasnodar' value='50'/>
	<distance from='khabarovsk' to='krasnodar' value='120'/>
	<distance from='petersburg' to='moscow' value='10'/>
	<distance from='petersburg' to='krasnodar' value='30'/>
	<distance from='petersburg' to='novosibirsk' value='60'/>
	<distance from='petersburg' to='ekaterinburg' value='40'/>
	<distance from='petersburg' to='vladivostok' value='120'/>
	<distance from='petersburg' to='khabarovsk' value='120'/>
	</distances>
	</regions>`);

	configsArr.push(elementRegions);

	global.resources.configs = { hash: Math.round(new Date().getTime() / 1000), data: configsArr };
}