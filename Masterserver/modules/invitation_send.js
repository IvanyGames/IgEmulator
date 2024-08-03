var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');
var scriptTools = require('../scripts/tools.js');

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][InvitationSend]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "24" });
        return;
    }

    var nickname = stanza.children[0].children[0].attrs.nickname;
    var is_follow = stanza.children[0].children[0].attrs.is_follow;

    if (is_follow != "0" && is_follow != "1") {
        //console.log("[" + stanza.attrs.from + "][InvitationSend]:Invalid follow type");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '21' });
        return;
    }

    global.db.warface.profiles.findOne({ nick: nickname }, { projection: { "username": 1, "experience": 1, "clan_name": 1, "missions_unlocked": 1, "classes_unlocked": 1 } }, function (errProfile, resultProfile) {

        if (errProfile) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Failed to getting data from the database");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "22" });
            return;
        }

        if (!resultProfile) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Target profile not found");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "23" });
            return;
        }

        var profileObject = global.users.jid[stanza.attrs.from];

        if (!profileObject) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Profile not found 2");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "24" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "24", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        var roomObject = profileObject.room_object;

        if (!roomObject) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:The player is not in the room 2");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '25' });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "25", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        if (roomObject.mission.mode == "pve" && resultProfile.missions_unlocked.indexOf((roomObject.mission.type ? roomObject.mission.type : roomObject.mission.difficulty)) == -1) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Target mission is locked");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "12" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "12", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        if (scriptTools.getLevelByExp(resultProfile.experience) < Number(global.startupParams.min_rank) || scriptTools.getLevelByExp(resultProfile.experience) > Number(global.startupParams.max_rank)) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Target rank mismatch");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "13" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "13", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        if (roomObject.core.players.length == roomObject.custom_params.max_players) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:The room is full, invite is not possible");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "14" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "14", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
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

            if ((roomObject.clan_war.clan_1 == profileObject.clan_name && countPlayersTeam1 >= (roomObject.custom_params.max_players / 2)) || (roomObject.clan_war.clan_2 == profileObject.clan_name && countPlayersTeam2 >= (roomObject.custom_params.max_players / 2))) {
                //console.log("[" + stanza.attrs.from + "][InvitationSend]:The room is full, invite is not possible");
                global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "14" });
                if (is_follow == "1") {
                    global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "14", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
                }
                return;
            }
        }

        var kickedIndex = roomObject.kicked.indexOf(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient");

        if (kickedIndex != -1) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Target player is kicked");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "15" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "15", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        if (roomObject.room_type == 4 && !resultProfile.clan_name) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:In order to invite the clan battle, target must be a member of the clan");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "18" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "18", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        if (roomObject.clan_war.clan_1 != resultProfile.clan_name && roomObject.clan_war.clan_2 != resultProfile.clan_name && roomObject.clan_war.clan_1 != "" && roomObject.clan_war.clan_2 != "") {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Target cannot invited the room because clan is not participating in this battle");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "19" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "19", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        var isClassesVerificationPassed = false;
        for (var i = 0; i < roomObject.custom_params.class_restriction_arr.length; i++) {
            if (resultProfile.classes_unlocked.indexOf(roomObject.custom_params.class_restriction_arr[i]) != -1) {
                isClassesVerificationPassed = true;
                break;
            }
        }

        if (!isClassesVerificationPassed) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Target classes is not available in room");
            global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "20" });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "20", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        var set_ticket = roomObject.room_id + "_" + profileObject._id + "_" + nickname;

        if (global.arrRoomInvitations.findIndex(function (x) { return x.ticket == set_ticket; }) != -1) {
            //console.log("[" + stanza.attrs.from + "][InvitationSend]:Ticket already exists");
            global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '26' });
            if (is_follow == "1") {
                global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", new ltxElement("invitation_result", { result: "25", user: nickname, is_follow: is_follow, user_id: resultProfile.username }));
            }
            return;
        }

        if (roomObject.invited.indexOf(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient") == -1) {
            roomObject.invited.push(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient");
        }

        global.xmppClient.response(stanza, new ltxElement("invitation_send", { nickname: nickname, is_follow: is_follow }));

        var elementInvitationRequest = new ltxElement('invitation_request', { from: profileObject.nick, ticket: set_ticket, room_id: roomObject.room_id, ms_resource: global.startupParams.resource, is_follow: is_follow });
        elementInvitationRequest.c("initiator_info", { online_id: profileObject.username + "@" + global.config.masterserver.domain + "/GameClient", profile_id: profileObject._id, is_online: 1, name: profileObject.nick, clan_name: profileObject.clan_name, experience: profileObject.experience, badge: profileObject.banner_badge, mark: profileObject.banner_mark, stripe: profileObject.banner_stripe });

        if (is_follow == "0") {
            elementInvitationRequest.children.push(scriptGameroom.getClientLtx(roomObject, true));
        }

        var request_id = global.xmppClient.request(resultProfile.username + "@" + global.config.masterserver.domain + "/GameClient", elementInvitationRequest);

        global.arrRoomInvitations.push({ ticket: set_ticket, token: request_id, targetNick: nickname, targetUsername: resultProfile.username, isFollow: is_follow, senderJid: stanza.attrs.from, timerObject: setTimeout(expireTicket, 60000, set_ticket) });
    });
}


function expireTicket(ticket) {

    var indexRoomInvitation = global.arrRoomInvitations.findIndex(function (x) { return x.ticket == ticket; });

    if (indexRoomInvitation == -1) {
        return;
    }

    var objectRoomInvitation = global.arrRoomInvitations[indexRoomInvitation];

    //console.log("[InvitationSend][ExpireTicket]:Ticket '" + ticket + "' is expire");
    global.xmppClient.request(objectRoomInvitation.senderJid, new ltxElement("invitation_result", { result: 9, user: objectRoomInvitation.targetNick, is_follow: objectRoomInvitation.isFollow, user_id: objectRoomInvitation.targetUsername }));
    global.arrRoomInvitations.splice(indexRoomInvitation, 1);
}