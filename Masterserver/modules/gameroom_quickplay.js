var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomQuickplay]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    global.xmppClient.response(stanza, new ltxElement('gameroom_quickplay', { queue_interval_milisec: 0, token: 0, need_resync_content: 0, time_to_maps_reset_notification: 120, response_time: 10, timestamp: 0 }));
}