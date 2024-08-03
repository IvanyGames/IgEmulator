var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][RepairItem]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
        return;
    }

    var item_id = Number(stanza.children[0].children[0].attrs.item_id);
    var repair_cost = Number(stanza.children[0].children[0].attrs.repair_cost);

    var itemObject = profileObject.items[profileObject.items.findIndex(function (x) { return (x.repair_cost > 0 && x.id == item_id) })];

    if (!itemObject) {
        //console.log("[" + stanza.attrs.from + "][RepairItem]:Item " + item_id + " not found or not have repair const");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
        return;
    }

    if (Number.isNaN(repair_cost) || !Number.isSafeInteger(repair_cost) || repair_cost < 1 || repair_cost > itemObject.repair_cost) {
        //console.log("[" + stanza.attrs.from + "][RepairItem]:Incorrect repair cost");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    if (repair_cost > profileObject.game_money) {
        //console.log("[" + stanza.attrs.from + "][RepairItem]:No enjoy money");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    profileObject.game_money -= repair_cost;

    itemObject.durability_points += Math.round(((itemObject.total_durability_points - itemObject.durability_points) / 100) * (100 / (itemObject.repair_cost / repair_cost)));
    itemObject.repair_cost -= repair_cost;
    itemObject.expired_confirmed = 0;

    if (!itemObject.repair_cost) {
        delete itemObject.repair_cost;
    }

    global.xmppClient.response(stanza, new ltxElement("repair_item", { accept_repair: "1", total_durability: itemObject.total_durability_points, durability: itemObject.durability_points, game_money: profileObject.game_money, repair_cost: itemObject.repair_cost }));
}