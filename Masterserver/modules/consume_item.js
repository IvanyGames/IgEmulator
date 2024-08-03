var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js')

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var session_id = Number(stanza.children[0].children[0].attrs.session_id);
    var profile_id = Number(stanza.children[0].children[0].attrs.profile_id);
    var item_profile_id = (Number(stanza.children[0].children[0].attrs.item_profile_id) - (profile_id * 1000));
    var current_checkpoint = Number(stanza.children[0].children[0].attrs.current_checkpoint);

    var profileObject = global.users._id[profile_id];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][ConsumeItem]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var itemObject = profileObject.items[profileObject.items.findIndex(function (x) { return (x.quantity > 0 && x.id == item_profile_id) })];

    if (!itemObject) {
        //console.log("[" + stanza.attrs.from + "][ConsumeItem]:Item not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    itemObject.quantity--;

    if (itemObject.quantity == 0 && itemObject.name == "mission_access_token_04") {

        var roomObject = profileObject.room_object;

        if (roomObject) {
            var playerObject = profileObject.room_player_object;
            playerObject.mission_access_tokens = 0;
            playerObject.status = scriptGameroom.getNewPlayerStatus(roomObject, playerObject.missions_unlocked, playerObject.classes_unlocked, playerObject.mission_access_tokens);
            roomObject.core.revision++;
        }
    }

    //console.log("[" + stanza.attrs.from + "][ConsumeItem]:" + itemObject.quantity);

    var elementGetExpiredItems = new ltxElement("get_expired_items");
    elementGetExpiredItems.c("consumable_item", itemObject);
    global.xmppClient.request(profileObject.username + "@" + global.config.masterserver.domain + "/GameClient", elementGetExpiredItems);

    global.xmppClient.response(stanza, new ltxElement("consume_item"));
}