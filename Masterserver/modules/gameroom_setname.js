var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomSetName]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetName]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var room_name = stanza.children[0].children[0].attrs.room_name;

    var playerObject = profileObject.room_player_object;

    if (roomObject.room_type != 2) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetName]:Changing name is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetName]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.status == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetName]:The player is ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetName]:Changing name is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    if (!scriptGameroom.validateRoomName(room_name)) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetName]:RoomName validation failed");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    roomObject.core.room_name = room_name;

    roomObject.core.revision++;

    var elementGameroom = new ltxElement("gameroom_setname");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}