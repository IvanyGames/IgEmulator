var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var ticket = stanza.children[0].children[0].attrs.ticket;
    var result = stanza.children[0].children[0].attrs.result;

    var ticketObject = global.ticketsObject[ticket]

    var username = stanza.attrs.from.split("@")[0];

    if (ticketObject && ticketObject.targetUsername == username) {
        clearTimeout(ticketObject.timerObject);
        global.xmppClient.request(ticketObject.senderJid, new ltxElement("invitation_result", { result: result, user: ticketObject.targetNick, is_follow: ticketObject.isFollow, user_id: ticketObject.targetUsername }));
        delete global.ticketsObject[ticket];
    }

    global.xmppClient.response(stanza, new ltxElement("invitation_accept"));
}