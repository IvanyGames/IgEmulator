var ltxElement = require('ltx').Element;

exports.module = function (stanza) {

    var id = stanza.children[0].children[0].attrs.id;
    var result = stanza.children[0].children[0].attrs.result;

    global.xmppClient.response(stanza, new ltxElement("gameroom_offer_response"));
}