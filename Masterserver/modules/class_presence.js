var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var username = stanza.attrs.from.split("@")[0];

    if (username != "dedicated") {
        return;
    }

    //console.log(stanza.children[0].children[0].attrs);

    global.xmppClient.response(stanza, new ltxElement('class_presence'));
}