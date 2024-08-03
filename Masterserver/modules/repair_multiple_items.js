var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var itemsToRepairArr = [];
    var itemsToRepairSum = 0;

    var elemetsItem = stanza.children[0].children[0].getChildren("item");

    for (var i = 0; i < elemetsItem.length; i++) {

        var item_id = Number(elemetsItem[i].attrs.item_id);

        var itemObject = profileObject.items[profileObject.items.findIndex(function (x) { return (x.repair_cost > 0 && x.id == item_id) })];

        if (!itemObject) {
            //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:Item " + item_id + " not found or not have repair const");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
            return;
        }

        itemsToRepairSum += itemObject.repair_cost;
        itemsToRepairArr.push(itemObject);
    }

    if (itemsToRepairSum > profileObject.game_money) {
        //console.log("[" + stanza.attrs.from + "][RepairMultipleItems]:No enjoy money");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
        return;
    }

    profileObject.game_money -= itemsToRepairSum;

    var elementRepairMultipleItems = new ltxElement("repair_multiple_items", { game_money: profileObject.game_money });

    for (var i = 0; i < itemsToRepairArr.length; i++) {

        var itemObject = itemsToRepairArr[i];

        itemObject.durability_points = itemObject.total_durability_points;
        itemObject.expired_confirmed = 0;
        delete itemObject.repair_cost;

        elementRepairMultipleItems.c("item", { item_id: itemObject.id, total_durability: itemObject.total_durability_points, durability: itemObject.durability_points });
    }

    global.xmppClient.response(stanza, elementRepairMultipleItems);
}