var ltxElement = require('ltx').Element
var scriptTools = require('../scripts/tools.js')

var filterPistolsOnly = [1, 2, 4, 29, 30, 31, 32, 33, 34];
var filterMeleeOnly = [1, 2, 3, 29, 30, 31, 32, 33, 34];

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var id = Number(stanza.children[0].children[0].attrs.id);

    var profileObject = global.users._id[id];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GetProfile]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GetProfile]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
        return;
    }

    if (stanza.attrs.from != roomObject.dedicatedServerJid) {
        //console.log("[" + stanza.attrs.from + "][GetProfile]:Gameroom mismatch");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
        return;
    }

    var elementGetProfile = new ltxElement("getprofile", { id: profileObject._id });

    var elementProfile = elementGetProfile.c("profile", { user_id: profileObject.username, nickname: profileObject.nick, gender: profileObject.gender, height: profileObject.height, fatness: profileObject.fatness, head: profileObject.head, current_class: profileObject.current_class, experience: profileObject.experience, preset: "DefaultPreset", clanName: profileObject.clan_name, unlocked_classes: scriptTools.getFlagByNumericArray(profileObject.classes_unlocked), group_id: "" });

    elementProfile.c("boosts", { xp_boost: 0, vp_boost: 0, gm_boost: 0, zb_boost: 0, is_vip: 0 });

    var elementItems = elementProfile.c("items");
    for (var i = 0; i < profileObject.items.length; i++) {

        var itemInfo = profileObject.items[i];
        
        if (!((itemInfo.slot != 0 && itemInfo.equipped != 0) || (itemInfo.quantity != null && itemInfo.quantity > 0))) {
            continue;
        }

        var itemSlotType = scriptTools.getItemTypeFromSlotArr(scriptTools.getItemSlotArr(itemInfo.slot));

        if (roomObject.custom_params.inventory_slot == 17678991309 && filterPistolsOnly.indexOf(itemSlotType) != -1) {
            continue;
        }

        if ((roomObject.custom_params.inventory_slot == 17678991317 || roomObject.mission.mode == "lms") && filterMeleeOnly.indexOf(itemSlotType) != -1) {
            continue;
        }

        //((itemInfo.slot != 0 && itemInfo.equipped != 0) || (itemInfo.quantity != null && itemInfo.quantity > 0))

        elementItems.c("item", { id: ((profileObject._id * 1000) + itemInfo.id), name: itemInfo.name, attached_to: itemInfo.attached_to, config: itemInfo.config, slot: itemInfo.slot, equipped: itemInfo.equipped, default: itemInfo.default, permanent: itemInfo.permanent, expired_confirmed: itemInfo.expired_confirmed, buy_time_utc: itemInfo.buy_time_utc, expiration_time_utc: itemInfo.expiration_time_utc, seconds_left: itemInfo.seconds_left, total_durability_points: itemInfo.total_durability_points, durability_points: itemInfo.durability_points, quantity: itemInfo.quantity });
    }

    global.xmppClient.response(stanza, elementGetProfile);
}