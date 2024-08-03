var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][UiUserChoice]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    //global.xmppClient.request("k01." + global.config.masterserver.domain, new ltxElement("gameroom_quickplay_cancel_backend", { username: profileObject.username }));

    global.xmppClient.response(stanza, new ltxElement("ui_user_choice"));
}