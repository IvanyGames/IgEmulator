var ltxElement = require('ltx').Element
var scriptTools = require('../scripts/tools.js')

var filterPistolsOnly = [3, 98304, 3145728, 3072, 98307, 3145731, 3075, 3244032, 101376, 3148800, 3244035, 101379, 3148803, 3247104, 3247107, 2, 65536, 2097152, 65538, 2097154, 2162688, 2162690, 12, 393216, 12582912, 12288, 393228, 12582924, 12300, 12976128, 405504, 12595200, 12976140, 405516, 12595212, 12988416, 12988428, 17, 557056, 17825792, 17408, 557073, 17825809, 17425, 18382848, 574464, 17843200, 18382865, 574481, 17843217, 18400256, 18400273, 7, 229376, 7340032, 7168, 229383, 7340039, 7175, 7569408, 236544, 7347200, 7569415, 236551, 7347207, 7576576, 7576583, 16, 524288, 16777216, 16384, 524304, 16777232, 16400, 17301504, 540672, 16793600, 17301520, 540688, 16793616, 17317888, 17317904, 19482642, 14070797, 21647380];
var filterMeleeOnly = [4, 131072, 4194304, 4096, 131076, 4194308, 4100, 4325376, 135168, 4198400, 4325380, 135172, 4198404, 4329472, 4329476, 2, 65536, 2097152, 65538, 2097154, 2162688, 2162690, 12, 393216, 12582912, 12288, 393228, 12582924, 12300, 12976128, 405504, 12595200, 12976140, 405516, 12595212, 12988416, 12988428, 17, 557056, 17825792, 17408, 557073, 17825809, 17425, 18382848, 574464, 17843200, 18382865, 574481, 17843217, 18400256, 18400273, 7, 229376, 7340032, 7168, 229383, 7340039, 7175, 7569408, 236544, 7347200, 7569415, 236551, 7347207, 7576576, 7576583, 16, 524288, 16777216, 16384, 524304, 16777232, 16400, 17301504, 540672, 16793600, 17301520, 540688, 16793616, 17317888, 17317904, 19482642, 14070797, 21647380];

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

    var elementGetProfile = new ltxElement("getprofile", { id: profileObject._id });

    var elementProfile = elementGetProfile.c("profile", { user_id: profileObject.username, nickname: profileObject.nick, gender: profileObject.gender, height: profileObject.height, fatness: profileObject.fatness, group_id: "", head: profileObject.head, current_class: profileObject.current_class, experience: profileObject.experience, preset: "DefaultPreset", clanName: profileObject.clan_name, unlocked_classes: scriptTools.getFlagByNumericArray(profileObject.classes_unlocked) });

    elementProfile.c("boosts", { xp_boost: 0, vp_boost: 0, gm_boost: 0, zb_boost: 0, ic_boost: 0, is_vip: 0 });

    var elementItems = elementProfile.c("items");
    for (var i = 0; i < profileObject.items.length; i++) {

        var itemInfo = profileObject.items[i];

        if (!((itemInfo.slot != 0 && itemInfo.equipped != 0) || (itemInfo.quantity != null && itemInfo.quantity > 0))) {
            continue;
        }

        if (itemInfo.name == "arl01_tutor") {
            continue;
        }

        if (roomObject.custom_params.inventory_slot == 2109734861 && filterPistolsOnly.indexOf(itemInfo.slot) == -1) {
            continue;
        }

        if (roomObject.custom_params.inventory_slot == 2109734869 && filterMeleeOnly.indexOf(itemInfo.slot) == -1) {
            continue;
        }

        elementItems.c("item", { id: ((profileObject._id * 1000) + itemInfo.id), name: itemInfo.name, attached_to: itemInfo.attached_to, config: itemInfo.config, slot: itemInfo.slot, equipped: itemInfo.equipped, default: itemInfo.default, permanent: itemInfo.permanent, expired_confirmed: itemInfo.expired_confirmed, buy_time_utc: itemInfo.buy_time_utc, expiration_time_utc: itemInfo.expiration_time_utc, seconds_left: itemInfo.seconds_left, hours_left: Math.round(itemInfo.seconds_left / 3600), total_durability_points: itemInfo.total_durability_points, durability_points: itemInfo.durability_points, quantity: itemInfo.quantity });
    }

    global.xmppClient.response(stanza, elementGetProfile);
}