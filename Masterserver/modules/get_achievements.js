var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')
var scriptTools = require('../scripts/tools.js')

exports.module = function (stanza) {

	var achievement = stanza.children[0].children[0].getChild("achievement");

	if (!achievement) {
		//console.log("[" + stanza.attrs.from + "][GetAchievements]:Incorrect paket");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '1' });
		return;
	}

	var profileObject = global.users._id[achievement.attrs.profile_id];

	if (!profileObject) {
		//console.log("[" + stanza.attrs.from + "][GetAchievements]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
		return;
	}

	var elementGetAchievements = new ltxElement("get_achievements");

	var elementAchievement = elementGetAchievements.c("achievement", { profile_id: profileObject._id });

	for (var i = 0; i < profileObject.achievements.length; i++) {
		elementAchievement.c("chunk", profileObject.achievements[i])
	}

	global.xmppClient.response(stanza, elementGetAchievements);

	if (profileObject.is_starting_achievements_issued != true) {
		profileObject.is_starting_achievements_issued = true;
		var newRank = scriptTools.getLevelByExp(profileObject.experience);
		scriptProfile.updateAchievementsAmmount(profileObject, [{ id: 54, command: "set", amount: newRank }, { id: 55, command: "set", amount: newRank }, { id: 58, command: "set", amount: newRank }, { id: 93, command: "give" }, { id: 94, command: "give" }, { id: 95, command: "give" }, { id: 137, command: "give" }, { id: 138, command: "give" }], function (res) {

		});
	}
}