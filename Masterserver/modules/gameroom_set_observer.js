var ltxElement = require('ltx').Element
//var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {
    
    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomSetObserver]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "4" });
        return;
    }

    var roomObject = profileObject.room_object;

    if (!roomObject) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetObserver]:The player is not in the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
        return;
    }

    var is_observer = Number(stanza.children[0].children[0].attrs.is_observer);

    if(isNaN(is_observer) || (is_observer != 1 && is_observer != 0)) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetObserver]:IsObserver value is not valid");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '6' });
        return;
    }

    var target_id = Number(stanza.children[0].children[0].attrs.target_id);

    var profileObjectTarget = global.users._id[target_id];

    if (!profileObjectTarget) {
        //console.log("["+stanza.attrs.from+"][GameroomSetObserver]:Profile target not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "7" });
        return;
    }

    var playerObject = profileObject.room_player_object;

    if (roomObject.room_type != 2 && roomObject.room_type != 4) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetObserver]:SetObserver is not allowed in this type of room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '8' });
        return;
    }

    if (playerObject.profile_id != roomObject.room_master.master) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetObserver]:The player is not the master of the room");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '9' });
        return;
    }

    if (roomObject.session.status != 0) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetObserver]:SetObserver is prohibited when the session is running");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '10' });
        return;
    }

    var playerObjectToObserverIndex = roomObject.core.players.findIndex(function (x) { return x.profile_id == profileObjectTarget._id });

    var playerObjectToObserver = roomObject.core.players[playerObjectToObserverIndex];

    if (!playerObjectToObserver) {
        //console.log("[" + stanza.attrs.from + "][GameroomSetObserver]:Target not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '11' });
        return;
    }
    
    playerObjectToObserver.observer = is_observer;

    roomObject.core.revision++;

    var elementGameroom = new ltxElement("gameroom_set_observer");
    //elementGameroom.children.push(scriptGameroom.getClientLtx(roomObject, false));
    global.xmppClient.response(stanza, elementGameroom);
}