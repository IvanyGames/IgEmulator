const fs = require("fs");
const ltx = require("ltx");
var scriptTools = require('./tools.js');


global.resources = {};

exports.load = function () {
	//console.log("[ResourcesLoad]:Loading...");
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
	loadAnticheatConfiguration();
	//console.log("[ResourcesLoad]:Success");
}

var getFiles = function (dir, files_) {

	files_ = files_ || [];
	var files = fs.readdirSync(dir);
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

function loadExpCurveTable() {
	console.log("[ResourcesLoad]:Loading ExpCurveTable");
	global.resources.tableExpCurve = {};
	var ExpCurve = ltx.parse(fs.readFileSync("./gamedata/libs/config/expcurve.xml"));
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
	var default_slots = ltx.parse(fs.readFileSync("./gamedata/libs/config/default_slots.xml")).getChildren("slot_def");
	for (cur_def_slot in default_slots) {
		defaultSlotsObj[default_slots[cur_def_slot].attrs.name] = { id: Number(default_slots[cur_def_slot].attrs.id), always_equip: Boolean(default_slots[cur_def_slot].attrs.always_equip) }
	}
	global.resources.defaultSlots = defaultSlotsObj;
}

function loadDefaultItems() {
	console.log("[ResourcesLoad]:Loading DefaultItems");

	var defaultItemsNamesObject = {};
	var defaultItemsArr = [];
	var elementDefaultItems = ltx.parse(fs.readFileSync("./gamedata/libs/config/defaultitems.xml")).getChildren("item");

	var classesIdexesTable = ["R", "H", "S", "M", "E"];

	var itemId = 1;

	for (var i = 0; i < elementDefaultItems.length; i++) {
		var itemInfoAttrs = elementDefaultItems[i].attrs;

		var itemEquipped = 0;

		var itemName = itemInfoAttrs.name;
		if (!itemName) errorBadAttr("loadDefaultItems", "name", "item");

		var itemClasses = itemInfoAttrs.classes;
		if (!itemClasses) errorBadAttr("loadDefaultItems", "classes", "item");

		var m_slotForClass = [0, 0, 0, 0, 0];

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

			m_slotForClass[itemClassIndex] = itemSlotId;

			if (!defaultItemsNamesObject[itemClassIndex]) {
				defaultItemsNamesObject[itemClassIndex] = {};
			}

			defaultItemsNamesObject[itemClassIndex][itemSlotId] = itemName;
		}

		var itemSlot = (m_slotForClass[0] & 0x3F | ((m_slotForClass[1] & 0x3F | ((((m_slotForClass[3] & 0x3F | ((m_slotForClass[4] & 0x3F) << 6)) << 6) | m_slotForClass[2] & 0x3F) << 6)) << 6) | 0x40000000);

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

	var elementGameModesConfig = ltx.parse(fs.readFileSync("./gamedata/libs/config/masterserver/game_modes_config.xml", "utf8"));

	var elementRestrictionOptions = elementGameModesConfig.getChild("restriction_options");

	function gmcParseXmlBlock(elementData, modeName, roomType) {

		var elementSettings = elementData.getChild("settings");

		if (elementSettings) {
			var elementSettingArr = elementSettings.getChildren("setting");
			for (var i = 0; i < elementSettingArr.length; i++) {
				var elemntSettingAttrs = elementSettingArr[i].attrs;
				gmcSetSetting(modeName, roomType, elemntSettingAttrs.kind, elemntSettingAttrs.value);
			}
		}

		var elementRestrictions = elementData.getChild("restrictions");

		if (elementRestrictions) {
			var elementRestrictionArr = elementRestrictions.getChildren("restriction");
			for (var i = 0; i < elementRestrictionArr.length; i++) {
				var elemntRestrictionAttrs = elementRestrictionArr[i].attrs;

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
					if (elemntRestrictionAttrs.kind == "inventory_slot") {
						eValue = scriptTools.getInventorySlotNumberFromString(eValue);
					}
					allowedsArr.push(eValue);
				}

				var eDefaultValue = elementRestrictionOption.attrs.default;
				if (elemntRestrictionAttrs.kind == "inventory_slot") {
					eDefaultValue = scriptTools.getInventorySlotNumberFromString(eDefaultValue);
				}

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
				//throw "";
				continue;
			}

			gmcParseXmlBlock(elementRoom, modeName, roomType);
		}
	}

	var elementGameModesConfigGameModes = elementGameModesConfig.getChild("game_modes");
	if (!elementGameModesConfigGameModes) {
		elementGameModesConfigGameModes = elementGameModesConfig.c("game_modes");
		var gamemodesPathsArr = getFiles("./gamedata/libs/config/masterserver/gamemodes");
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
	//console.log(global.resources.configGameModes.tdm.restrictions.inventory_slot);
}

function loadRewardsConfiguration() {
	console.log("[ResourcesLoad]:Loading RewardsConfiguration");
	var RewardsConfigurationJson = {};
	var cRewardsConfiguration = ltx.parse(fs.readFileSync("./gamedata/libs/config/masterserver/rewards_configuration.xml"));

	var cRewards = cRewardsConfiguration.getChild("Rewards");
	if (!cRewards) errorGetChild("loadRewardsConfiguration", "Rewards", "RewardsConfiguration");

	function parseMultipliers() {

		var aMultiplierNames = [
			"MoneyMultiplier",
			"ExperienceMultiplier",
			"SponsorPointsMultiplier"
		]

		for (var i = 0; i < aMultiplierNames.length; i++) {
			var MultiplierName = aMultiplierNames[i];

			if (!RewardsConfigurationJson[MultiplierName]) RewardsConfigurationJson[MultiplierName] = {};

			var cElementMultiplier = cRewards.getChild(MultiplierName);
			if (!cElementMultiplier) errorGetChild("loadRewardsConfiguration", MultiplierName, "Rewards");

			var cMultiplierElements = cElementMultiplier.getChildElements();
			for (var e = 0; e < cMultiplierElements.length; e++) {

				var cMultiplierElement = cMultiplierElements[e];

				var cMultiplierElementText = Number(cMultiplierElement.getText());

				if (Number.isNaN(cMultiplierElementText)) errorBadChildElement("loadRewardsConfiguration", cMultiplierElement.name, cElementMultiplier.name);

				RewardsConfigurationJson[MultiplierName][cMultiplierElement.name] = cMultiplierElementText;
			}

		}

		if (!RewardsConfigurationJson.MoneyMultiplier.default) {
			console.log("[ResourceLoad][loadRewardsConfiguration]:MoneyMultiplier is not have default key");
			throw "";
		}

		if (!RewardsConfigurationJson.ExperienceMultiplier.default) {
			console.log("[ResourceLoad][loadRewardsConfiguration]:ExperienceMultiplier is not have default key");
			throw "";
		}

		if (!RewardsConfigurationJson.SponsorPointsMultiplier.default) {
			console.log("[ResourceLoad][loadRewardsConfiguration]:SponsorPointsMultiplier is not have default key");
			throw "";
		}

	}

	function parseClanPointsMultipliers() {

		var cClanPointsMultiplier = cRewards.getChild("ClanPointsMultiplier");
		if (!cClanPointsMultiplier) errorGetChild("loadRewardsConfiguration", "ClanPointsMultiplier", "Rewards");

		RewardsConfigurationJson.ClanPointsMultiplier = {};

		var cpmRoomTypes = {
			"pve_private": 1,
			"pvp_public": 2,
			"pvp_clanwar": 4,
			"pvp_autostart": 8,
			"pve_autostart": 16,
			"pvp_rating": 32
		}

		for (cpmKey in cpmRoomTypes) {

			var cmpRoomType = cpmRoomTypes[cpmKey];

			var cModeName = cClanPointsMultiplier.getChild(cpmKey);
			if (!cModeName) errorGetChild("loadRewardsConfiguration", "cpmKey", "ClanPointsMultiplier");

			var vRoomTypeMultiplier = Number(cModeName.attrs.room_type_multiplier);
			if (Number.isNaN(vRoomTypeMultiplier)) errorBadAttr("loadRewardsConfiguration", "room_type_multiplier", "cModeName");

			RewardsConfigurationJson.ClanPointsMultiplier[cmpRoomType] = { RoomTypeMultiplier: vRoomTypeMultiplier, GroupMultipliers: [] };

			var cGroupMultipliers = cModeName.getChildren("group_multiplier");
			for (var i = 0; i < cGroupMultipliers.length; i++) {
				var cGroupMultiplier = cGroupMultipliers[i];

				var cGroupMultiplierValue = Number(cGroupMultiplier.attrs.value);
				if (Number.isNaN(cGroupMultiplierValue)) errorBadAttr("loadRewardsConfiguration", "value", "GroupMultiplier");

				RewardsConfigurationJson.ClanPointsMultiplier[cmpRoomType].GroupMultipliers.push(cGroupMultiplierValue);
			}
		}
	}

	function parseStaticMultipliers() {

		var aStaticFields = [
			"ItemRepairMultiplier",
			"WinPoolDefault",
			"LosePoolDefault",
			"DrawPoolDefault",
			"ScorePoolDefault",
			"MinReward",
			"SecondaryObjectiveBonus",
			"IncompleteSessionRewardPerMin",
			"IncompleteSessionRewardCap"
		]

		for (var i = 0; i < aStaticFields.length; i++) {

			var aStaticFieldName = aStaticFields[i];

			var cStaticMultiplier = cRewards.getChild(aStaticFieldName);
			if (!cStaticMultiplier) {
				errorGetChild("loadRewardsConfiguration", aStaticFieldName, "Rewards");
			}

			var cStaticMultiplierText = Number(cStaticMultiplier.getText());
			if (Number.isNaN(cStaticMultiplierText)) errorBadChildElement("loadRewardsConfiguration", aStaticFieldName, "Rewards");

			RewardsConfigurationJson[aStaticFieldName] = cStaticMultiplierText;

		}

	}

	function parseBonusRewardPools() {
		var cBonusRewardPools = cRewards.getChildren("BonusRewardPool");
		if (!cBonusRewardPools) errorGetChild("loadRewardsConfiguration", "BonusRewardPool", "Rewards");

		RewardsConfigurationJson.BonusRewardPools = {};

		for (var i = 0; i < cBonusRewardPools.length; i++) {

			var cBonusRewardPoolMissionType = cBonusRewardPools[i].attrs.mission_type;
			if (!cBonusRewardPoolMissionType) errorBadAttr("loadRewardsConfiguration", "mission_type", "BonusRewardPool");

			var cBonusRewardPoolValue = Number(cBonusRewardPools[i].attrs.value);
			if (Number.isNaN(cBonusRewardPoolValue)) errorBadAttr("loadRewardsConfiguration", "value", "BonusRewardPool");

			RewardsConfigurationJson.BonusRewardPools[cBonusRewardPoolMissionType] = cBonusRewardPoolValue;
		}
	}

	function parsePlayerCountRewardMults() {
		var cPlayerCountRewardMults = cRewards.getChild("player_count_reward_mults");
		if (!cPlayerCountRewardMults) errorGetChild("loadRewardsConfiguration", "player_count_reward_mults", "Rewards");

		RewardsConfigurationJson.PlayerCountRewardMults = [];

		var cPlayerCountRewardMultsValues = cPlayerCountRewardMults.getChildren("Value");
		for (var i = 0; i < cPlayerCountRewardMultsValues.length; i++) {
			cPlayerCountRewardMultsValueText = Number(cPlayerCountRewardMultsValues[i].getText());
			if (Number.isNaN(cPlayerCountRewardMultsValueText)) errorBadChildElement("loadRewardsConfiguration", "Value", "player_count_reward_mults");

			RewardsConfigurationJson.PlayerCountRewardMults.push(cPlayerCountRewardMultsValueText);
		}
	}

	function parseCheckpointsPassedRewardMults() {
		var cCheckpointsPassedRewardMults = cRewards.getChild("checkpoints_passed_reward_mults");
		if (!cCheckpointsPassedRewardMults) errorGetChild("loadRewardsConfiguration", "checkpoints_passed_reward_mults", "Rewards");

		RewardsConfigurationJson.CheckpointsPassedRewardMults = [];

		var cCheckpointsPassedRewardMultsValues = cCheckpointsPassedRewardMults.getChildren("Value");
		for (var i = 0; i < cCheckpointsPassedRewardMultsValues.length; i++) {
			cCheckpointsPassedRewardMultsValueText = Number(cCheckpointsPassedRewardMultsValues[i].getText());
			if (Number.isNaN(cCheckpointsPassedRewardMultsValueText)) errorBadChildElement("loadRewardsConfiguration", "Value", "checkpoints_passed_reward_mults");

			RewardsConfigurationJson.CheckpointsPassedRewardMults.push(cCheckpointsPassedRewardMultsValueText);
		}
	}

	function parseRoundLimitRewardMults() {

		var cRoundLimitRewardMults = cRewards.getChild("round_limit_reward_mults");
		if (!cRoundLimitRewardMults) errorGetChild("loadRewardsConfiguration", "round_limit_reward_mults", "Rewards");

		RewardsConfigurationJson.RoundLimitRewardMults = {};

		var cRoundMultipliers = cRoundLimitRewardMults.getChildren("RoundMultiplier");
		for (var i = 0; i < cRoundMultipliers.length; i++) {

			var RoundLimit = Number(cRoundMultipliers[i].attrs.round_limit);
			if (Number.isNaN(RoundLimit)) errorBadAttr("loadRewardsConfiguration", "round_limit", "round_limit_reward_mults");

			var Value = Number(cRoundMultipliers[i].attrs.value);
			if (Number.isNaN(Value)) errorBadAttr("loadRewardsConfiguration", "value", "round_limit_reward_mults");

			RewardsConfigurationJson.RoundLimitRewardMults[RoundLimit] = Value;
		}
	}

	function parseGameModeFirstWinOfDayBonus() {

		var cGameModeFirstWinOfDayBonus = cRewardsConfiguration.getChild("GameModeFirstWinOfDayBonus");
		if (!cGameModeFirstWinOfDayBonus) errorGetChild("loadRewardsConfiguration", "GameModeFirstWinOfDayBonus", "RewardsConfiguration");

		if (!cGameModeFirstWinOfDayBonus.attrs.enabled) errorBadAttr("loadRewardsConfiguration", "enabled", "GameModeFirstWinOfDayBonus");
		var GameModeFirstWinOfDayBonusEnabled = Boolean(cGameModeFirstWinOfDayBonus.attrs.enabled);

		RewardsConfigurationJson.GameModeFirstWinOfDayBonus = { enabled: GameModeFirstWinOfDayBonusEnabled, modes: {} };

		var cGameModeFirstWinOfDayBonusModes = cGameModeFirstWinOfDayBonus.getChildren("Mode");
		for (var i = 0; i < cGameModeFirstWinOfDayBonusModes.length; i++) {

			var Name = cGameModeFirstWinOfDayBonusModes[i].attrs.name;
			if (!Name) errorBadAttr("loadRewardsConfiguration", "name", "Mode");

			var Bonus = Number(cGameModeFirstWinOfDayBonusModes[i].attrs.bonus);
			if (Number.isNaN(Bonus)) errorBadAttr("loadRewardsConfiguration", "bonus", "Mode");

			RewardsConfigurationJson.GameModeFirstWinOfDayBonus.modes[Name] = Bonus;
		}
	}

	function parseCrownRewards() {
		var cCrownRewards = cRewardsConfiguration.getChild("CrownRewards");
		if (!cCrownRewards) errorGetChild("loadRewardsConfiguration", "CrownRewards", "RewardsConfiguration");

		RewardsConfigurationJson.CrownRewards = {};

		var cCrownRewardsArr = cCrownRewards.getChildren("Reward");
		for (var i = 0; i < cCrownRewardsArr.length; i++) {

			var Type = cCrownRewardsArr[i].attrs.type;
			if (!Type) errorBadAttr("loadRewardsConfiguration", "type", "Reward");

			var Bronze = Number(cCrownRewardsArr[i].attrs.bronze);
			if (Number.isNaN(Bronze)) errorBadAttr("loadRewardsConfiguration", "bronze", "Reward");

			var Silver = Number(cCrownRewardsArr[i].attrs.silver);
			if (Number.isNaN(Silver)) errorBadAttr("loadRewardsConfiguration", "silver", "Reward");

			var Gold = Number(cCrownRewardsArr[i].attrs.gold);
			if (Number.isNaN(Gold)) errorBadAttr("loadRewardsConfiguration", "gold", "Reward");

			RewardsConfigurationJson.CrownRewards[Type] = { bronze: Bronze, silver: Silver, gold: Gold };
		}
	}

	parseMultipliers();
	parseClanPointsMultipliers();
	parseStaticMultipliers();
	parseBonusRewardPools();
	parsePlayerCountRewardMults();
	parseCheckpointsPassedRewardMults();
	parseRoundLimitRewardMults();
	parseGameModeFirstWinOfDayBonus();
	parseCrownRewards();

	global.resources.RewardsConfiguration = RewardsConfigurationJson;
}

function loadMissions() {
	console.log("[ResourcesLoad]:Loading Missions");

	var missionsObject = { uid: {}, name: {} };

	var missionsPathsArr = getFiles("./gamedata/libs/missions");

	for (var i = 0; i < missionsPathsArr.length; i++) {
		var missionLtxParsed = ltx.parse(fs.readFileSync(missionsPathsArr[i], "utf-8"));

		removeTextFromLtxElements(missionLtxParsed);

		if ((missionLtxParsed.attrs.release_mission == "1" && missionLtxParsed.attrs.game_mode != "pve") || global.config.allow_no_release_missions) {
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
			var mapElement = global.resources.missions.name[mapInfoAttrs.name.toLowerCase()];

			if (!mapElement || (allowedMissionTypes && allowedMissionTypes.indexOf(mapElement.attrs.game_mode) == -1) || mapElement.attrs.only_clan_war_mission == "1" || (filterRating && mapElement.attrs.rating_game_mission != "1")) {
				//console.log("[ResourcesLoad][loadQuickplayMaps][createMapsArr]:Skip '" + mapInfoAttrs.name);
				continue;
			}

			resultArr.push(mapElement.attrs.uid);
		}
		return resultArr;
	}

	var quickplayMapsObject = { autostartMaps: [], ratingGameMaps: [], cachedQuickplayMaplist: new ltx.Element("quickplay_maplist", { code: "3", from: "0", to: 0, hash: Math.round(new Date().getTime() / 1000) }) };

	var elementQuickplayMaps = ltx.parse(fs.readFileSync("./gamedata/libs/config/masterserver/quickplay_maps.xml"));

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

	var elementAutostartMaps = elementChannel.getChild("autostart_maps");
	if (!elementAutostartMaps) errorGetChild("loadQuickplayMaps", "autostart_maps", "quickplay");
	quickplayMapsObject.autostartMaps = createMapsArr(elementAutostartMaps, null, false);

	var elementRatingGameMaps = elementChannel.getChild("rating_game_maps");
	//if (!elementRatingGameMaps) errorGetChild("loadQuickplayMaps", "rating_game_maps", "quickplay");
	if (elementRatingGameMaps) {
		quickplayMapsObject.ratingGameMaps = createMapsArr(elementRatingGameMaps, ["ptb", "ctf"], true);
	}

	for (var i = 0; i < quickplayMapsObject.autostartMaps.length; i++) {
		quickplayMapsObject.cachedQuickplayMaplist.c("map", { mission: quickplayMapsObject.autostartMaps[i] });
		quickplayMapsObject.cachedQuickplayMaplist.attrs.to++;
	}

	global.resources.quickplayMaps = quickplayMapsObject;
}

function loadAchievementsList() {
	console.log("[ResourcesLoad]:Loading AchievementsList");

	var achievementsArr = [];
	var AchievementDesc = ltx.parse(fs.readFileSync("./gamedata/libs/config/achievementdesc.xml"));
	//var AchievementLocalization = ltx.parse(fs.readFileSync("./gamedata/languages/text_achievements.xml"));

	//Создание обьекта с локализацией достяжений
	var LocalizationObj = {};
	/*
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

	//Добавление новых нашивок
	var achievementsPathsArr = getFiles("./gamedata/libs/config/achievements");

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
	var elementSpecialRewardConfiguration = ltx.parse(fs.readFileSync("./gamedata/libs/config/masterserver/special_reward_configuration.xml"));

	var elementsEvent = elementSpecialRewardConfiguration.getChildren("event");
	for (var i = 0; i < elementsEvent.length; i++) {
		var elementEvent = elementsEvent[i];

		var rewardsArr = [];

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
				case "unlock":

					break;
				case "item_unlock":

					break;
				default:
					console.log("[ResourcesLoad][LoadSpecialRewardConfiguration]:RewardType '" + elementChild.name + "' is unknown!");
					throw "";
			}
		}

		objectSpecialRewardConfiguration[elementEvent.attrs.name] = { use_notification: Number(elementEvent.attrs.use_notification), rewards: rewardsArr };
	}

	global.resources.objectSpecialRewardConfiguration = objectSpecialRewardConfiguration;
}

//TODO item_unlock mission_unlock
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
		fileProfileProgressionConfigXml = fs.readFileSync("./gamedata/libs/config/masterserver/profile_progression_config.xml");
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

//TODO МНОГО ЧЕГО
function loadCustomRules() {
	console.log("[ResourcesLoad]:Loading CustomRules");

	var objectCustomRules = { scheduled_reward: {}, progression_reward: {}, consecutive_login_bonus: [], dynamic_items: {}, reward_multiplier: {}, mission_reward: {} };

	var fileCustomRulesXml;

	try {
		fileCustomRulesXml = fs.readFileSync("./gamedata/libs/config/masterserver/custom_rules.xml");
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

			if (elementMissionReward.attrs.enabled == "1") {

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

					var elementRewardText = elementsReward[e].attrs.name;

					if (!elementRewardText) {
						console.log("[ResourcesLoad][LoadCustomRules][ConsecutiveLoginBonus][Streak][Reward]:Text is missing!");
						throw "";
					}

					objectCustomRules.consecutive_login_bonus.push(elementRewardText);
				}

			}

		}

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

function loadAnticheatConfiguration() {
	global.resources.ltxAnticheatConfiguration = ltx.parse(fs.readFileSync("./gamedata/libs/config/masterserver/anticheat_configuration.xml"));
}