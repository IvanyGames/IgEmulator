var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][NotifyExpiredItems]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var elemetsItem = stanza.children[0].children[0].getChildren("item");

    for (var i = 0; i < elemetsItem.length; i++) {

        var item_id = Number(elemetsItem[i].attrs.item_id);

        if (Number.isNaN(item_id)) {
            continue;
        }

        var expiredIndex = profileObject.expired_items.findIndex(function (x) { return x.id == item_id });

        if (expiredIndex == -1) {
            continue;
        }

        profileObject.expired_items.splice(expiredIndex, 1);
    }

    global.xmppClient.response(stanza, new ltxElement("notify_expired_items"));
}