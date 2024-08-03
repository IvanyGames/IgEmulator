var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    global.xmppClient.response(stanza, new ltxElement("send_anticheat_report"));
}