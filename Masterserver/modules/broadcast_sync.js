var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js')
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {

    if (stanza.attrs.from != "k01." + global.config.masterserver.domain) {
        return;
    }

    var elementsInBroadcastSync = stanza.children[0].children[0].getChildElements();

    for (var i = 0; i < elementsInBroadcastSync.length; i++) {
        handlerSelector(elementsInBroadcastSync[i]);
    }

}

function handlerSelector(broadcastQuery) {
    switch (broadcastQuery.name) {
        case "clan_kick":
            handlerClanKick(broadcastQuery);
            break;
        case "update_achievements_ammount":
            handlerUpdateAchievementsAmmount(broadcastQuery);
            break;
        default:
    }
}

function handlerClanKick(clankickQuery) {

    var profile_id = Number(clankickQuery.attrs.profile_id);

    var profileObject = global.users._id[profile_id];

    if (!profileObject) {
        return;
    }

    profileObject.clan_name = "";

    var roomObject = profileObject.room_object;

    if (roomObject) {
        if (roomObject.room_type == 4) {
            global.xmppClient.request(profileObject.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("gameroom_on_kicked"));
            gameroom_leave.module({ attrs: { from: profileObject.username + "@" + global.config.masterserver.domain + "/GameClient" } }, false, true, 7);
        } else {
            var playerObject = profileObject.room_player_object;
            playerObject.clanName = "";
            roomObject.core.revision++;
        }
    }

}

function handlerUpdateAchievementsAmmount(updateAchievementsAmmountQuery) {

    var profile_id = Number(updateAchievementsAmmountQuery.attrs.profile_id);

    var profileObject = global.users._id[profile_id];

    if (!profileObject) {
        return;
    }

    var elementsAchievementParams = updateAchievementsAmmountQuery.getChildren("achievement_params");

    var achievementsParamsArr = [];
    for (var i = 0; i < elementsAchievementParams.length; i++) {
        var attrsAchievementParams = elementsAchievementParams[i].attrs;
        achievementsParamsArr.push({ id: Number(attrsAchievementParams.id), command: attrsAchievementParams.command, amount: Number(attrsAchievementParams.amount) });
    }

    scriptProfile.updateAchievementsAmmount(profileObject, achievementsParamsArr, function (res) {

    });
}