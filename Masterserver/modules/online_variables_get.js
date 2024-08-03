var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("["+stanza.attrs.from+"][OnlineVariablesGet]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var elementOnlineVariablesGet = new ltxElement("online_variables_get");

    var elementVariables = elementOnlineVariablesGet.c("variables");

    for (var key in global.config.variables_client) {
        elementVariables.c("item", { key: key, value: global.config.variables_client[key] });
    }

    global.xmppClient.response(stanza, elementOnlineVariablesGet);
}