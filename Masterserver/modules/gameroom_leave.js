var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza, isNeedResponse, isNeedRequest, nReason) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomLeave]:Profile not found");
        if (isNeedResponse) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        }
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomLeave]:The player is not in the room");
        if (isNeedResponse) {
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        }
        return;
    }

    var playerObject = profileObject.room_player_object;

    //Voting end on target player leave

    var votingObjectIndex = roomObject.voting.findIndex(function (x) { return x.team_id == playerObject.team_id });

    var votingObject = roomObject.voting[votingObjectIndex]

    if (votingObject && votingObject.target == playerObject.nickname) {

        clearTimeout(votingObject.timer_object);
        roomObject.voting.splice(votingObjectIndex, 1)

        var elementOnVoting = new ltxElement('on_voting_finished', { result: "1", yes: votingObject.current_yes, no: votingObject.current_no });

        for (var i = 0; i < roomObject.core.players.length; i++) {

            var localPlayerObject = roomObject.core.players[i];

            if (localPlayerObject.team_id != playerObject.team_id || (localPlayerObject.presence != 33 && localPlayerObject.presence != 37) || localPlayerObject.nickname == votingObject.target) {
                continue;
            }

            global.xmppClient.request(localPlayerObject.online_id, elementOnVoting);
        }
    }

    //----

    roomObject.core.players.splice(roomObject.core.players.findIndex(function (x) { return x.profile_id == profileObject._id }), 1);
    profileObject.room_object = null;
    profileObject.room_player_object = null;

    if (isNeedResponse) {
        global.xmppClient.response(stanza, new ltxElement("gameroom_leave"));
    }

    if (isNeedRequest) {
        global.xmppClient.request(stanza.attrs.from, new ltxElement("gameroom_leave"));
    }

    if (roomObject.core.players.length == 0) {

        global.gamerooms.splice(global.gamerooms.findIndex(function (x) { return x.room_id == roomObject.room_id }), 1);

        if (roomObject.dedicatedServerJid) {
            global.xmppClient.request(roomObject.dedicatedServerJid, new ltxElement("srv_player_kicked", { profile_id: profileObject._id, reason: nReason }));
            global.xmppClient.request(roomObject.dedicatedServerJid, new ltxElement("mission_unload"));
        }

        return;
    }

    if (roomObject.session.status != 0) {
        roomObject.core.room_left_players.push({ profile_id: profileObject._id, left_reason: nReason });
    }

    if (playerObject.profile_id == roomObject.room_master.master) {

        var playerObjectNewMaster = roomObject.core.players[0];

        roomObject.room_master.master = playerObjectNewMaster.profile_id;

        if (roomObject.session.status == 0 && playerObjectNewMaster.status == 1) {
            playerObjectNewMaster.status = 0;
        }

        roomObject.room_master.revision++;

        if (roomObject.regions.region_id != playerObjectNewMaster.region_id) {
            roomObject.regions.region_id = playerObjectNewMaster.region_id;
            roomObject.regions.revision++;
        }
    }

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

    roomObject.core.can_start = scriptGameroom.getCanStart(roomObject);

    roomObject.core.revision++;
}