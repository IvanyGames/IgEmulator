var ltxElement = require('ltx').Element
var confirm_notification = require('./confirm_notification')

exports.module = function (stanza) {

    var request_id = stanza.children[0].children[0].attrs.request_id;
    var result = stanza.children[0].children[0].attrs.result;

    var elementNotif = stanza.children[0].children[0].c("notif", { id: request_id });
    elementNotif.c("confirmation", { result: result });

    confirm_notification.module(stanza);
}