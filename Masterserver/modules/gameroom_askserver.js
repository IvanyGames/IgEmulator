var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomAskServer]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var playerObject = profileObject.room_player_object;

    if (roomObject.room_type != 1 && roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:Start rooom is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    if (playerObject.status != 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:The player is not ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:Start rooom is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '11' });
        return;
    }

    if (roomObject.core.can_start != 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:The room is not ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '12' });
        return;
    }

    if (scriptGameroom.startSession(roomObject) != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomAskServer]:Not found free dedicated server");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }
	
    var elementGameroom = new ltxElement("gameroom_askserver");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);

	/*
	
    for (var i = 0; i < roomObject.core.players.length; i++) {
        var roomPlayer = roomObject.core.players[i];
        global.xmppClient.request(roomObject.core.players[i].online_id, new ltxElement("admin_cmd", { command: "cvar", result: "net_enable_optimized_sessions = " + cvarNetEnableOptimizedSessions }));
		global.xmppClient.request(roomObject.core.players[i].online_id, new ltxElement("admin_cmd", { command: "cvar", result: "pl_lerpMethod = " + cvarPlLerpMethod }));
    }
	
	*/
}