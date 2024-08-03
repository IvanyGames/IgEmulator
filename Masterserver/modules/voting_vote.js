var ltxElement = require('ltx').Element
var gameroom_leave = require('./gameroom_leave.js')

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][VotingVote]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][VotingVote]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '2' });
        return;
    }

    var answer = stanza.children[0].children[0].attrs.answer;

    var playerObject = profileObject.room_player_object;

    var votingObjectIndex = roomObject.voting.findIndex(function (x) { return x.team_id == playerObject.team_id });

    var votingObject = roomObject.voting[votingObjectIndex]

    if (!votingObject) {
        //console.log("[" + stanza.attrs.from + "][VotingVote]:Team not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '3' });
        return;
    }

    if (votingObject.target == playerObject.nickname) {
        //console.log("[" + stanza.attrs.from + "][VotingVote]:The excluded person is prohibited from voting");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
        return;
    }

    if (playerObject.presence != 33 && playerObject.presence != 37) {
        //console.log("[" + stanza.attrs.from + "][VotingVote]:The player not in game");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '4' });
        return;
    }

    if (votingObject.voted_players.indexOf(playerObject.profile_id) != -1) {
        //console.log("[" + stanza.attrs.from + "][VotingVote]:The player has already voted");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    votingObject.voted_players.push(playerObject.profile_id);

    if (answer == "1") {
        votingObject.current_yes++;
    } else {
        votingObject.current_no++;
    }

    global.xmppClient.response(stanza, new ltxElement('voting_vote', { answer: answer }));

    var elementOnVoting;

    if (votingObject.current_yes == votingObject.required_yes || votingObject.current_no == votingObject.required_no) {
        elementOnVoting = new ltxElement('on_voting_finished', { result: (votingObject.current_yes == votingObject.required_yes ? "0" : "1"), yes: votingObject.current_yes, no: votingObject.current_no });
        clearTimeout(votingObject.timer_object);
        roomObject.voting.splice(votingObjectIndex, 1)
    } else {
        elementOnVoting = new ltxElement('on_voting_vote', { yes: votingObject.current_yes, no: votingObject.current_no });
    }

    for (var i = 0; i < roomObject.core.players.length; i++) {

        var localPlayerObject = roomObject.core.players[i];

        if (localPlayerObject.team_id != playerObject.team_id || (localPlayerObject.presence != 33 && localPlayerObject.presence != 37) || localPlayerObject.nickname == votingObject.target) {
            continue;
        }

        global.xmppClient.request(localPlayerObject.online_id, elementOnVoting);
    }

    if (votingObject.current_yes == votingObject.required_yes) {

        //console.log("[" + stanza.attrs.from + "][VotingVote]:Player kick");

        var playerObjectTarget = roomObject.core.players[roomObject.core.players.findIndex(function (x) { return x.nickname == votingObject.target })];

        if (playerObjectTarget) {
            roomObject.kicked.push(playerObjectTarget.online_id);
            gameroom_leave.module({ attrs: { from: playerObjectTarget.online_id } }, false, true, 3);
        }
    }
}