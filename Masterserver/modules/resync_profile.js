var ltxElement = require('ltx').Element
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

    //console.log("["+stanza.attrs.from+"][ResyncProfile]:Successfully");
    global.xmppClient.response(stanza, elementResyncProfile);
}