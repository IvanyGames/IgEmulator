var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomSwitchteams]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteams]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var playerObject = profileObject.room_player_object;

    if (roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteams]:Changing teams is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteams]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.status == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteamss]:The player is ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (roomObject.mission.no_teams == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteams]:Changing teams is not possible when they are disabled");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    if (roomObject.custom_params.auto_team_balance == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteams]:Changing teams is not possible with auto balance enabled");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomSwitchteams]:Changing teams is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    roomObject.core.teams_switched = roomObject.core.teams_switched == 0 ? 1 : 0;

    roomObject.core.revision++;

    var elementGameroom = new ltxElement("gameroom_switchteams");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}