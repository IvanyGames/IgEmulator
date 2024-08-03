var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][PlayerStatus]:Profile not found");
        return;
    }

    var new_status = Number(stanza.children[0].children[0].attrs.new_status);

    if (Number.isNaN(new_status) || new_status < 0) {
        //console.log("["+stanza.attrs.from+"][PlayerStatus]:Incorrect status");
        return;
    }

    global.db.warface.profiles.findOneAndUpdate({ username: profileObject.username }, { $set: { status: new_status } }, { projection: { "_id": 1 } }, function (errUpdate, resultUpdate) {

        var profileObject = global.users.jid[stanza.attrs.from];

        if (!profileObject) {
            //console.log("["+stanza.attrs.from+"][PlayerStatus]:Profile not found");
            return;
        }

        profileObject.status = new_status;

        var roomObject = profileObject.room_object;

        if (!roomObject) {
            return;
        }

        var playerObject = profileObject.room_player_object;

        if ((playerObject.presence != 33 && playerObject.presence != 37) && (new_status == 33 || new_status == 37)) {

            //console.log("["+stanza.attrs.from+"][PlayerStatus]:Joined in game");

            var votingObjectIndex = roomObject.voting.findIndex(function (x) { return x.team_id == playerObject.team_id });

            var votingObject = roomObject.voting[votingObjectIndex]

            if (votingObject && votingObject.target != playerObject.nickname) {

                var elementOnVotingStarted = new ltxElement('on_voting_started', { initiator: votingObject.initiator, target: votingObject.target, yes_votes_required: votingObject.required_yes, no_votes_required: votingObject.required_no, votes_required: votingObject.required_yes });
                var elementOnVotingVote = new ltxElement('on_voting_vote', { yes: votingObject.current_yes, no: votingObject.current_no });

                global.xmppClient.request(stanza.attrs.from, elementOnVotingStarted);
                global.xmppClient.request(stanza.attrs.from, elementOnVotingVote);
            }
        }

        if ((playerObject.presence == 33 || playerObject.presence == 37) && (new_status != 33 && new_status != 37)) {

            //console.log("["+stanza.attrs.from+"][PlayerStatus]:Left from game game");

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
        }

        playerObject.presence = new_status;

        roomObject.core.revision++;

    });
}