var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomPromoteToHost]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var new_host_profile_id = Number(stanza.children[0].children[0].attrs.new_host_profile_id);

    var playerObject = profileObject.room_player_object;

    if (roomObject.room_type != 1 && roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:Changing leader is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.status == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:The player is ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:Changing leader is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    if (playerObject.profile_id == new_host_profile_id) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:You can`t give leader yourself");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    var playerObjectNewMaster = roomObject.core.players[roomObject.core.players.findIndex(function (x) { return x.profile_id == new_host_profile_id })];

    if (!playerObjectNewMaster) {
        //console.log("[" + stanza.attrs.from + "][GameroomPromoteToHost]:New leader not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '11' });
        return;
    }

    roomObject.room_master.master = playerObjectNewMaster.profile_id;

    if (playerObjectNewMaster.status == 1) {
        playerObjectNewMaster.status = 0;
        roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);
        roomObject.core.revision++;
    }

    roomObject.room_master.revision++;

    if (roomObject.regions.region_id != playerObjectNewMaster.region_id) {
        roomObject.regions.region_id = playerObjectNewMaster.region_id;
        roomObject.regions.revision++;
    }

    var elementGameroom = new ltxElement("gameroom_promote_to_host");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}