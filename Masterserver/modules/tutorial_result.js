var ltxElement = require('ltx').Element;
var scriptProfile = require('../scripts/profile.js');
var scriptTools = require('../scripts/tools.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][TutorialResult]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var id = stanza.children[0].children[0].attrs.id;

    if (id != "678d8734-1c8a-4d72-bc87-19bdb40107a8") {
        //console.log("["+stanza.attrs.from+"][TutorialResult]:Tutorial not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
        return;
    }

    var profileOldExperience = profileObject.experience;
    var profileOldMoney = profileObject.game_money;

    if (!profileObject.tutorial_passed) {

        profileObject.tutorial_passed = true;

        scriptProfile.giveGameItem(profileObject, [{ name: "game_money_item_01", durabilityPoints: 0, expirationTime: "", quantity: 9750, offerId: 0 }, { name: "exp_item_01", durabilityPoints: 0, expirationTime: "", quantity: 250, offerId: 0 }], false, null, null);
    }

    var profileGainedExperience = profileObject.experience - profileOldExperience;
    var profileGainedMoney = profileObject.game_money - profileOldMoney;

    var elementBroadcastSessionResult = new ltxElement("brodcast_session_result");

    var elementPlayerResult = elementBroadcastSessionResult.c("player_result", { nickname: profileObject.nick, money: profileGainedMoney, experience: profileGainedExperience, sponsor_points: 0, bonus_money: 0, bonus_experience: 0, bonus_sponsor_points: 0, gained_crown_money: 0, completed_stages: 0, money_boost: 0, experience_boost: 0, sponsor_points_boost: 0, experience_boost_percent: 0, money_boost_percent: 0, sponsor_points_boost_percent: 0, is_vip: 0, score: 0, no_crown_rewards: 1, dynamic_multipliers_info: "", dynamic_crown_multiplier: 1, misison_passed: "none," + profileObject.missions_unlocked.join(",") + ",all" });
    elementPlayerResult.c("profile_progression_update", { profile_id: profileObject._id, mission_unlocked: "none," + profileObject.missions_unlocked.join(",") + ",all", tutorial_unlocked: (1 + (profileObject.experience >= 120 ? 2 : 0) + (profileObject.experience >= 2900 ? 4 : 0)), tutorial_passed: scriptTools.getFlagByNumericArray(profileObject.tutorials_passed), class_unlocked: scriptTools.getFlagByNumericArray(profileObject.classes_unlocked) });

    global.xmppClient.response(stanza, new ltxElement("tutorial_result"));

    global.xmppClient.request(stanza.attrs.from, elementBroadcastSessionResult);
}