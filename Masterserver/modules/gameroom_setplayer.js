var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomSetPlayer]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetPlayer]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var team_id = Number(stanza.children[0].children[0].attrs.team_id);
    var status = Number(stanza.children[0].children[0].attrs.status);
    var class_id = Number(stanza.children[0].children[0].attrs.class_id);

    var playerObject = profileObject.room_player_object;

    if (playerObject.team_id != team_id && roomObject.room_type == 2 && roomObject.mission.no_teams == 0 && roomObject.custom_params.auto_team_balance == 0 && playerObject.status != 1 && (team_id == 1 || team_id == 2)) {

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

        if ((team_id == 1 && (roomObject.custom_params.max_players / 2) > countPlayersTeam1) || (team_id == 2 && (roomObject.custom_params.max_players / 2) > countPlayersTeam2)) {
            playerObject.team_id = team_id;
        }
    }

    if (playerObject.status != status && playerObject.status != 2 && (roomObject.room_type == 1 || roomObject.room_type == 2 || roomObject.room_type == 4) && (status == 0 || status == 1)) {
        playerObject.status = status;
        roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);
    }

    if (playerObject.class_id != class_id && roomObject.custom_params.class_restriction_arr.indexOf(class_id) != -1 && playerObject.classes_unlocked.indexOf(class_id) != -1) {
        playerObject.class_id = class_id;
    }

    roomObject.core.revision++;

    var elementGameroom = new ltxElement("gameroom_setplayer");
    elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}