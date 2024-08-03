var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][GameroomQuickplayCancel]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    global.xmppClient.request(stanza.attrs.from, new ltxElement('gameroom_quickplay_canceled', { uid: "" }));
    global.xmppClient.response(stanza, new ltxElement('gameroom_quickplay_cancel', { success: 1 }))

}