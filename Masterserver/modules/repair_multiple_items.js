var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza, autoRepairObject) {

    var profileObject;

    if (!autoRepairObject) {

        profileObject = global.users.jid[stanza.attrs.from];

        if (!profileObject) {
            //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:Profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
            return;
        }

    } else {

        profileObject = autoRepairObject.profileObject;

    }

    var elementRepairMultipleItems;
    var elementRepairResult;

    if (!autoRepairObject) {
        elementRepairMultipleItems = new ltxElement("repair_multiple_items", { game_money: "0" });
        elementRepairResult = elementRepairMultipleItems.c("RepairResult", { operation_status: "1" });
    }

    var itemsToRepairArr = [];
    var itemsToRepairSum = 0;

    if (!autoRepairObject) {

        var elemetsItem = stanza.children[0].children[0].getChildren("item");

        for (var i = 0; i < elemetsItem.length; i++) {

            var item_id = Number(elemetsItem[i].attrs.item_id);

            var itemObject = profileObject.items[profileObject.items.findIndex(function (x) { return (x.repair_cost > 0 && x.id == item_id) })];

            if (!itemObject) {
                //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:Item " + item_id + " not found or not have repair const");
                elementRepairResult.attrs.operation_status = "0";
                global.xmppClient.response(stanza, elementRepairMultipleItems);
                return;
            }

            itemsToRepairSum += itemObject.repair_cost;
            itemsToRepairArr.push(itemObject);
        }

    } else {

        for (var i = 0; i < profileObject.items.length; i++) {

            var itemObject = profileObject.items[i];

            if (!itemObject.repair_cost) {
                continue;
            }

            itemsToRepairSum += itemObject.repair_cost;
            itemsToRepairArr.push(itemObject);
        }

    }

    if (!itemsToRepairArr.length) {
        //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:No items to repair");
        if (!autoRepairObject) {
            elementRepairResult.attrs.operation_status = "0";
            global.xmppClient.response(stanza, elementRepairMultipleItems);
        }
        return;
    }

    if (itemsToRepairSum > profileObject.game_money) {
        //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:No enjoy money");
        if (!autoRepairObject) {
            elementRepairResult.attrs.operation_status = "0";
            global.xmppClient.response(stanza, elementRepairMultipleItems);
        } else {
            scriptProfile.giveNotifications(profileObject.username, [{ type: 65536, params: { operation_status: 0, items: [] } }], function (nAddResult) {

            });
        }
        return;
    }

    var notificationRepairResultItems = [];

    for (var i = 0; i < itemsToRepairArr.length; i++) {

        var itemObject = itemsToRepairArr[i];

        itemObject.durability_points = itemObject.total_durability_points;
        itemObject.expired_confirmed = 0;

        var repairResultItem = { repair_status: 1, profile_item_id: itemObject.id, money_spent: itemObject.repair_cost, total_durability: itemObject.total_durability_points, durability: itemObject.durability_points };

        if (!autoRepairObject) {
            elementRepairResult.c("item", repairResultItem);
        } else {
            notificationRepairResultItems.push(repairResultItem);
        }

        delete itemObject.repair_cost;
    }

    profileObject.game_money -= itemsToRepairSum;

    if (!autoRepairObject) {
        elementRepairMultipleItems.attrs.game_money = profileObject.game_money;
        global.xmppClient.response(stanza, elementRepairMultipleItems);
    } else {
        scriptProfile.giveNotifications(profileObject.username, [{ type: 65536, params: { operation_status: 1, items: notificationRepairResultItems } }], function (nAddResult) {

        });
    }
}