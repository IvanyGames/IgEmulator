var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][DeleteItem]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var item_id = Number(stanza.children[0].children[0].attrs.item_id);

    var itemIndex = profileObject.items.findIndex(function (x) { return x.id == item_id });

    if (itemIndex == -1) {
        //console.log("["+stanza.attrs.from+"][DeleteItem]:Item '"+item_id+"' not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
        return;
    }

    var itemObject = profileObject.items[itemIndex];

    if (itemObject.default == 1 || itemObject.expired_confirmed != 1) {
        //console.log("["+stanza.attrs.from+"][DeleteItem]:Item '"+item_id+"' is not support delete");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
        return;
    }

    profileObject.items.splice(itemIndex, 1);

    global.xmppClient.response(stanza, new ltxElement("delete_item", { item_id: profileObject.item_id }));
}