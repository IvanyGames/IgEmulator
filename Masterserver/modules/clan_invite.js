var ltxElement = require('ltx').Element
var send_invitation = require('./send_invitation')


exports.module = function (stanza) {

    stanza.children[0].children[0].attrs.type = "16";
    send_invitation.module(stanza);
}