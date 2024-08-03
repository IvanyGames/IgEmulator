var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var load_result = stanza.children[0].children[0].attrs.load_result;
    var session_id = stanza.children[0].children[0].attrs.session_id;

    var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.dedicatedServerJid == stanza.attrs.from })];

    if (!roomObject) {
        return;
    }

    if(load_result != "success"){
        scriptGameroom.endSession(roomObject);
        return;
    }

    roomObject.session.status = 2;
    roomObject.session.revision++;
}