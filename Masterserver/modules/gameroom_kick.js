var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomKick]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var target_id = Number(stanza.children[0].children[0].attrs.target_id);

    var profileObjectTarget = global.users._id[target_id];

    if (!profileObjectTarget) {
        //console.log("["+stanza.attrs.from+"][GameroomKick]:Profile target not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "6" });
        return;
    }

    var playerObject = profileObject.room_player_object;

    if (roomObject.room_type != 1 && roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:Kick is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (playerObject.status == 1) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:The player is ready");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:Kick is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    if (playerObject.profile_id == target_id) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:You can't kick yourself");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '11' });
        return;
    }

    var playerObjectToKickIndex = roomObject.core.players.findIndex(function (x) { return x.profile_id == profileObjectTarget._id });

    var playerObjectToKick = roomObject.core.players[playerObjectToKickIndex];

    if (!playerObjectToKick) {
        //console.log("[" + stanza.attrs.from + "][GameroomKick]:Kick target not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '12' });
        return;
    }

    roomObject.kicked.push(playerObjectToKick.online_id);
    roomObject.core.players.splice(playerObjectToKickIndex, 1);
    profileObjectTarget.room_object = null;
    profileObjectTarget.room_player_object = null;

    if (roomObject.room_type == 4) {

        var countPlayersTeam1 = 0;
        var countPlayersTeam2 = 0;

        for (var i = 0; i < roomObject.core.players.length; i++) {
            if (roomObject.core.players[i].team_id == 1) {
                countPlayersTeam1++;
            }
            if (roomObject.core.players[i].team_id == 2) {
                countPlayersTeam2++;
            }
        }

        if (countPlayersTeam1 == 0) {
            roomObject.clan_war.clan_1 = "";
            roomObject.clan_war.revision++;
        }

        if (countPlayersTeam2 == 0) {
            roomObject.clan_war.clan_2 = "";
            roomObject.clan_war.revision++;
        }

    }

    if (playerObjectToKick.status == 1) {
        roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);
    }

    roomObject.core.revision++;

    var elementGameroom = new ltxElement("gameroom_kick");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);

    global.xmppClient.request(playerObjectToKick.online_id, new ltxElement("gameroom_on_kicked"));
}