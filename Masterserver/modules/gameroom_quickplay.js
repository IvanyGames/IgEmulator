var ltxElement = require('ltx').Element;
const crypto = require('crypto');
var gameroom_open = require('./gameroom_open.js');
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomQuickplay]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var room_type = stanza.children[0].children[0].attrs.room_type;
    var room_name = stanza.children[0].children[0].attrs.room_name;
    var mission_id = stanza.children[0].children[0].attrs.mission_id;
    var game_mode = stanza.children[0].children[0].attrs.game_mode;
    var status = stanza.children[0].children[0].attrs.status;
    var team_id = stanza.children[0].children[0].attrs.team_id;
    var class_id = stanza.children[0].children[0].attrs.class_id;
    var missions_hash = stanza.children[0].children[0].attrs.missions_hash;
    var content_hash = stanza.children[0].children[0].attrs.content_hash;
    var channel_switches = stanza.children[0].children[0].attrs.channel_switches;
    var timestamp = stanza.children[0].children[0].attrs.timestamp;
    var uid = stanza.children[0].children[0].attrs.uid;

    global.xmppClient.request(stanza.attrs.from, new ltxElement('gameroom_quickplay_started', { token: "0", mission_hash: missions_hash, content_hash: content_hash, time_to_maps_reset_notification: "120", response_time: "20", timestamp: timestamp, uid: uid }));
    global.xmppClient.response(stanza, new ltxElement("gameroom_quickplay", { queue_interval_milisec: 1000, token: 0 }));
    global.xmppClient.request(stanza.attrs.from, new ltxElement('gameroom_quickplay_canceled', { uid: uid }));
    return;

    var groupPlayersProfileId = [profileObject._id];

    var elementGroup = stanza.children[0].children[0].getChild("group");

    if (elementGroup) {

        var elementsPlayer = elementGroup.getChildren("player");

        for (var i = 0; i < elementsPlayer.length; i++) {

            var profileId = Number(elementsPlayer[i].attrs.profile_id);

            if (Number.isNaN(profileId)) {
                //console.log("["+stanza.attrs.from+"][GameroomQuickplay]:Incorrect profile id in group");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
                return;
            }

            if (groupPlayersProfileId.indexOf(profileId) != -1) {
                //console.log("["+stanza.attrs.from+"][GameroomQuickplay]:Duplicate profile id in group");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "3" });
                return;
            }

            groupPlayersProfileId.push(profileId);
        }
    }

    global.db.warface.profiles.find({ _id: { $in: groupPlayersProfileId } }, { projection: { "username": 1 } }).toArray(function (errProfiles, resultProfiles) {

        if (errProfiles || !resultProfiles) {
            return;
        }

        for (var i = 0; i < resultProfiles.length; i++) {
            global.xmppClient.request(resultProfiles[i].username, new ltxElement('gameroom_quickplay_started', { token: "0", mission_hash: missions_hash, content_hash: content_hash, time_to_maps_reset_notification: "120", response_time: "20", timestamp: timestamp, uid: uid }));
        }

        global.xmppClient.response(stanza, new ltxElement("gameroom_quickplay"));

        var probableGamerooms = [];

        for (var i = 0; i < global.gamerooms.length; i++) {

            var roomObject = global.gamerooms[i];

            if (roomObject.room_type != Number(room_type)) {
                continue;
            }

            if (game_mode && roomObject.mission.mode != game_mode) {
                continue;
            }

            if (mission_id && roomObject.mission.mission_key != mission_id) {
                continue;
            }

            if ((roomObject.core.players.length + resultProfiles) > roomObject.custom_params.max_players) {
                continue;
            }

            probableGamerooms.push(roomObject);
        }

        var roomObjectProbable = probableGamerooms[Math.floor(Math.random() * probableGamerooms.length)];

        if (!roomObjectProbable) {

            var missionId;

            if (global.startupParams.channel != "pve") {

                var missionsInfo = global.resources.missions.uid;

                var quickplayMaps = (room_type == "32" ? global.resources.quickplayMaps.ratingGameMaps : global.resources.quickplayMaps.autostartMaps);

                var probableMapsUid = [];

                for (var i = 0; i < quickplayMaps.length; i++) {

                    var missionInfo = missionsInfo[quickplayMaps[i]];

                    if (!missionInfo) {
                        continue;
                    }

                    if (game_mode && missionInfo.attrs.game_mode != game_mode) {
                        continue;
                    }

                    if (mission_id && missionInfo.attrs.uid != mission_id) {
                        continue;
                    }

                    probableMapsUid.push(missionInfo.attrs.uid);
                }

                missionId = probableMapsUid[Math.floor(Math.random() * probableMapsUid.length)];
            } else {
                missionId = mission_id;
            }

            roomObjectProbable = gameroom_open.module(null, true, room_type, missionId, room_name);

        }

        if (!roomObjectProbable) {
            for (var i = 0; i < resultProfiles.length; i++) {
                global.xmppClient.request(resultProfiles[i].username, new ltxElement('gameroom_quickplay_canceled', { uid: uid }));
            }
            return;
        }

        for (var i = 0; i < resultProfiles.length; i++) {

            //var elementGameroomOffer = new ltxElement("gameroom_offer", { from: profileObject.nick, room_id: roomObjectProbable.room_id, token: uid, team_id: "0", ms_resource: global.startupParams.resource, id: crypto.randomUUID(), silent: "1" });
            var elementGameroomOffer = new ltxElement("gameroom_offer", { from: profileObject.nick, ms_resource: global.startupParams.resource, id: crypto.randomUUID(), token: uid, silent: "1" });
            elementGameroomOffer.children.push(scriptGameroom.getClientLtx(roomObjectProbable, true));
            global.xmppClient.request(resultProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", elementGameroomOffer);
            global.xmppClient.request(resultProfiles[i].username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement('gameroom_quickplay_succeeded', { uid: uid }));
        }

    });
}