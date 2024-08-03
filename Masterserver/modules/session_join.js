var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][SessionJoin]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][SessionJoin]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var playerObject = profileObject.room_player_object;

    if (playerObject.status != 1) {
        //console.log("[" + stanza.attrs.from + "][SessionJoin]:The player is not ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    if (roomObject.session.status == 0) {
        //console.log("[" + stanza.attrs.from + "][SessionJoin]:Dedicated not allocated");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    var serverInfo = global.dedicatedServersObject[roomObject.dedicatedServerJid];

    if (!serverInfo) {
        //console.log("[" + stanza.attrs.from + "][SessionJoin]:Dedicated not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    global.xmppClient.response(stanza, new ltxElement("session_join", { room_id: roomObject.room_id, server: "wf-mr-srv_" + serverInfo.port, hostname: serverInfo.host, port: serverInfo.port, local: "0", session_id: roomObject.session.session_id }));
}