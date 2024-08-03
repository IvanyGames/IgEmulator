var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][VotingStart]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    if (global.startupParams.disable_voting_start == "1") {
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
        return;
    }

    var target = stanza.children[0].children[0].attrs.target;

    var playerObject = profileObject.room_player_object;

    if (roomObject.session.status != 2) {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:The session has not started yet");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
        return;
    }

    if (roomObject.mission.mode == "ffa") {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:Voting is not available in ffa mode");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
        return;
    }

    if (playerObject.presence != 33 && playerObject.presence != 37) {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:The player not in game");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    if (roomObject.voting.findIndex(function (x) { return x.team_id == playerObject.team_id }) != -1) {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:Voting has already started");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    var numberOfVoters = -1;
    var targetPlayerObject = null;

    for (var i = 0; i < roomObject.core.players.length; i++) {

        var localPlayerObject = roomObject.core.players[i];

        if (localPlayerObject.team_id != playerObject.team_id || (localPlayerObject.presence != 33 && localPlayerObject.presence != 37)) {
            continue;
        }

        numberOfVoters++;

        if (localPlayerObject.nickname != target) {
            continue;
        }

        targetPlayerObject = localPlayerObject;
    }

    //console.log("[" + stanza.attrs.from + "][VotingStart]: NumberOfVoters:" + numberOfVoters + " TargetPlayerObject:" + targetPlayerObject);

    if (numberOfVoters < 2) {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:Not enough players to start voting");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '7' });
        return;
    }

    if (!targetPlayerObject || targetPlayerObject.nickname == playerObject.nickname) {
        //console.log("[" + stanza.attrs.from + "][VotingStart]:Target not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    var requiredNumberYesVotes = Math.ceil(numberOfVoters * roomObject.kick_vote_params.success);
    var requiredNumberNoVotes = numberOfVoters > 2 ? (numberOfVoters - requiredNumberYesVotes) : 1;

    //console.log("[" + stanza.attrs.from + "][VotingStart]: requiredNumberYesVotes:" + requiredNumberYesVotes + " requiredNumberNoVotes:" + requiredNumberNoVotes);

    var votingObject = {
        team_id: playerObject.team_id,
        initiator: playerObject.nickname,
        target: targetPlayerObject.nickname,
        required_yes: requiredNumberYesVotes,
        required_no: requiredNumberNoVotes,
        current_yes: 1,
        current_no: 0,
        voted_players: [playerObject.profile_id],
        timer_object: setTimeout(timeoutOnVotingExpired, (roomObject.kick_vote_params.timeout * 1000), roomObject.room_id, playerObject.team_id)
    }

    roomObject.voting.push(votingObject);

    global.xmppClient.response(stanza, new ltxElement('voting_start', { target: target }));

    var elementOnVotingStarted = new ltxElement('on_voting_started', { initiator: votingObject.initiator, target: votingObject.target, yes_votes_required: votingObject.required_yes, no_votes_required: votingObject.required_no, votes_required: votingObject.required_yes });
    var elementOnVotingVote = new ltxElement('on_voting_vote', { yes: votingObject.current_yes, no: votingObject.current_no });

    for (var i = 0; i < roomObject.core.players.length; i++) {

        var localPlayerObject = roomObject.core.players[i];

        if (localPlayerObject.team_id != playerObject.team_id || (localPlayerObject.presence != 33 && localPlayerObject.presence != 37) || localPlayerObject.nickname == votingObject.target) {
            continue;
        }

        global.xmppClient.request(localPlayerObject.online_id, elementOnVotingStarted);
        global.xmppClient.request(localPlayerObject.online_id, elementOnVotingVote);
    }
}

function timeoutOnVotingExpired(roomId, teamId) {

    var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.room_id == roomId })];

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][VotingStart][TimerOnVotingExpired]:Room not found");
        return;
    }

    var votingObjectIndex = roomObject.voting.findIndex(function (x) { return x.team_id == teamId });

    var votingObject = roomObject.voting[votingObjectIndex]

    if (!votingObject) {
        //console.log("[" + stanza.attrs.from + "][VotingStart][TimerOnVotingExpired]:Team not found");
        return;
    }

    roomObject.voting.splice(votingObjectIndex, 1);

    var elementOnVotingFinished = new ltxElement('on_voting_finished', { result: "2", yes: votingObject.current_yes, no: votingObject.current_no });

    for (var i = 0; i < roomObject.core.players.length; i++) {

        var localPlayerObject = roomObject.core.players[i];

        if (localPlayerObject.team_id != teamId || (localPlayerObject.presence != 33 && localPlayerObject.presence != 37) || localPlayerObject.nickname == votingObject.target) {
            continue;
        }

        global.xmppClient.request(localPlayerObject.online_id, elementOnVotingFinished);
    }
}
//voting_start, voting_vote, gameroom_leave, player_status