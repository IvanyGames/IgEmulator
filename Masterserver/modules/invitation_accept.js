var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var ticket = stanza.children[0].children[0].attrs.ticket;
    var token = Number(stanza.children[0].children[0].attrs.token);
    var result = stanza.children[0].children[0].attrs.result;

    var indexRoomInvitation = global.arrRoomInvitations.findIndex(function (x) { return x.ticket == ticket || x.token == token; });

    if (indexRoomInvitation == -1) {
        global.xmppClient.response(stanza, new ltxElement("invitation_accept"));
        return;
    }

    var objectRoomInvitation = global.arrRoomInvitations[indexRoomInvitation];

    var username = stanza.attrs.from.split("@")[0];

    if (objectRoomInvitation.targetUsername != username) {
        global.xmppClient.response(stanza, new ltxElement("invitation_accept"));
        return;
    }

    clearTimeout(objectRoomInvitation.timerObject);
    global.xmppClient.request(objectRoomInvitation.senderJid, new ltxElement("invitation_result", { result: result, user: objectRoomInvitation.targetNick, is_follow: objectRoomInvitation.isFollow, user_id: objectRoomInvitation.targetUsername }));
    global.arrRoomInvitations.splice(indexRoomInvitation, 1);

    global.xmppClient.response(stanza, new ltxElement("invitation_accept"));
}