var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomGet]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var room_type = Number(stanza.children[0].children[0].attrs.room_type);
    var size = Number(stanza.children[0].children[0].attrs.size);
    var received = Number(stanza.children[0].children[0].attrs.received);
    var cancelled = Number(stanza.children[0].children[0].attrs.cancelled);
    var token = Number(stanza.children[0].children[0].attrs.token);

    if (Number.isNaN(size) || size < 0) {
        size = 0;
    }

    if (Number.isNaN(received) || received < 0) {
        received = 0;
    }

    if (Number.isNaN(token) || token < 0) {
        token = 0;
    }

    var cacheIndex = (token == 0 && global.roomBrowserCacheArr.length != 0) ? global.roomBrowserCacheArr.length - 1 : global.roomBrowserCacheArr.findIndex(x => x.cacheToken == token);

    if (cacheIndex == -1) {
        global.xmppClient.response(stanza, new ltxElement("gameroom_get", { left: 0, token: token }));
        return;
    }

    var cacheObject = global.roomBrowserCacheArr[cacheIndex];

    var roomsStart = received;
    var roomsEnd = received + size;
    var roomsLeft = 0;

    if (roomsEnd > cacheObject.cacheData.length) {
        roomsEnd = cacheObject.cacheData.length;
    } else {
        roomsLeft = cacheObject.cacheData.length - roomsEnd;
    }

    var elementGameroomGet = new ltxElement("gameroom_get", { left: roomsLeft, token: cacheObject.cacheToken });

    for (var i = roomsStart; i < roomsEnd; i++) {
        elementGameroomGet.children.push(cacheObject.cacheData[i]);
    }

    global.xmppClient.response(stanza, elementGameroomGet);
}