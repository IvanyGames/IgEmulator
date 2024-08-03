var ltxElement = require('ltx').Element
var scriptGameroom = require('../scripts/gameroom.js');

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    var attrs = stanza.children[0].children[0].attrs;

    if (global.config.dedicated_hosts[attrs.host]) {
        attrs.host = global.config.dedicated_hosts[attrs.host];
    }

    global.dedicatedServersObject[stanza.attrs.from] = attrs;

    global.xmppClient.response(stanza, new ltxElement('setserver', { master_node: attrs.node }));

    var roomObject = global.gamerooms[global.gamerooms.findIndex(function (x) { return x.dedicatedServerJid == stanza.attrs.from })];

    if (!roomObject) {
        return;
    }

    if (attrs.status == "1") {
        //roomObject.session.status = 1;
        //roomObject.session.revision++;
    } else if (attrs.status == "2") {
        //roomObject.session.status = 2;
        //roomObject.session.revision++;
    } else if (attrs.status == "3") {
        roomObject.session.status = 3;
        roomObject.session.revision++;
    } else if (attrs.status == "4") {
        scriptGameroom.endSession(roomObject);
    }
}