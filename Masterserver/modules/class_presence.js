var ltxElement = require('ltx').Element
var scriptTools = require('../scripts/tools.js')
var repair_multiple_items = require('./repair_multiple_items.js')

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var elementsProfile = stanza.children[0].children[0].getChildren("profile");

    for (var i = 0; i < elementsProfile.length; i++) {

        var elementProfile = elementsProfile[i];

        var profileObject = global.users._id[elementProfile.attrs.id];

        if (!profileObject) {
            //console.log("[" + stanza.attrs.from + "][ClassPresence]:Profile '" + elementProfile.attrs.id + "' not found or not online");
            continue;
        }

        var presenceArr = [0, 0, 0, 0, 0]

        var elementsPresence = elementProfile.getChildren("presence");

        for (var p = 0; p < elementsPresence.length; p++) {

            var elementPresence = elementsPresence[p];
            presenceArr[Number(elementPresence.attrs.class_id)] = Number(elementPresence.attrs.value);
        }

        for (var e = 0; e < profileObject.items.length; e++) {

            var itemObject = profileObject.items[e];

            if (!itemObject.durability_points || !itemObject.slot) {
                continue;
            }

            var sumTime = 0;

            var itemSlotArr = scriptTools.getItemSlotArr(itemObject.slot);

            for (var s = 0; s < itemSlotArr.length; s++) {
                if (itemSlotArr[s] > 0) {
                    sumTime += presenceArr[s];
                }
            }

            if (!sumTime) {
                continue;
            }

            var gameItemObject = global.cacheJsonQuickAccess.items.name[itemObject.name];

            if (!gameItemObject || !gameItemObject.repair_cost) {
                //console.log("[" + stanza.attrs.from + "][ClassPresence]:Item '" + itemObject.name + " not found in game items or not have repair_cost");
                continue;
            }

            itemObject.durability_points -= sumTime;

            if (itemObject.durability_points < 0) {
                itemObject.durability_points = 0;
            }

            var newRepairCost = Math.ceil(((gameItemObject.repair_cost) / 100) * (100 - (100 / (itemObject.total_durability_points / itemObject.durability_points))));

            if (newRepairCost > 0) {
                itemObject.repair_cost = newRepairCost;
            }
        }

        if (profileObject.persistent_settings.options && profileObject.persistent_settings.options["gameplay*auto_repair"] == "1") {
            repair_multiple_items.module(null, { profileObject: profileObject });
        }
    }

    global.xmppClient.response(stanza, new ltxElement("class_presence"));
}
//options gameplay.auto_repair