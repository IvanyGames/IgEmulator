var ltxElement = require('ltx').Element
var scriptTools = require('../scripts/tools.js')
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][ResyncProfile]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var elementResyncProfile = new ltxElement("resync_profile");

    scriptProfile.getExpiredItems(profileObject);

    for (var i = 0; i < profileObject.items.length; i++) {
        elementResyncProfile.c("item", profileObject.items[i]);
    }

    for (var i = 0; i < profileObject.expired_items.length; i++) {
        elementResyncProfile.c("expired_item", profileObject.expired_items[i]);
    }

    //Открытые предеметы 
    //elementResyncProfile.c("unlocked_item", {id:"12345"});

    elementResyncProfile.c("money", { game_money: profileObject.game_money, cry_money: profileObject.cry_money, crown_money: profileObject.crown_money });

    var elementCharacter = elementResyncProfile.c("character", { nick: profileObject.nick, gender: profileObject.gender, height: profileObject.height, fatness: profileObject.fatness, head: profileObject.head, current_class: profileObject.current_class, experience: profileObject.experience, banner_badge: profileObject.banner_badge, banner_mark: profileObject.banner_mark, banner_stripe: profileObject.banner_stripe, pvp_rating_rank: "1", pvp_rating_games_history: "" });
    elementCharacter.c("ProfileBans", {});

    var profileTutorialUnloked = 1 + (profileObject.experience >= 120 ? 2 : 0) + (profileObject.experience >= 2900 ? 4 : 0);
    elementResyncProfile.c("progression").c("profile_progression_state", { profile_id: profileObject._id, mission_unlocked: "none," + profileObject.missions_unlocked.join(",") + ",all", tutorial_unlocked: profileTutorialUnloked, tutorial_passed: scriptTools.getFlagByNumericArray(profileObject.tutorials_passed), class_unlocked: scriptTools.getFlagByNumericArray(profileObject.classes_unlocked) });

    //console.log("["+stanza.attrs.from+"][ResyncProfile]:Successfully");
    global.xmppClient.response(stanza, elementResyncProfile);
}