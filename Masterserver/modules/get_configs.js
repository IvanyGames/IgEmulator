var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var from = Number(stanza.children[0].children[0].attrs.from);
    var to = Number(stanza.children[0].children[0].attrs.to);
    var hash = stanza.children[0].children[0].attrs.hash;
    var cached = stanza.children[0].children[0].attrs.cached;

    var elementGetConfigs = new ltxElement("get_configs", { code: 1, from: 0, to: 0, hash: global.resources.configs.hash });

    if (cached != global.resources.configs.hash) {
        if (Number.isNaN(from) || from < 0) {
            from = 0;
        }

        if (Number.isNaN(to) || to <= from) {
            to = from + 250;
        }

        if (to >= global.resources.configs.data.length) {
            to = global.resources.configs.data.length;
            elementGetConfigs.attrs.code = 3;
        } else {
            elementGetConfigs.attrs.code = 2;
        }

        elementGetConfigs.attrs.from = from;
        elementGetConfigs.attrs.to = to;

        for (var i = from; i < to; i++) {
            var itemInfo = global.resources.configs.data[i];
            elementGetConfigs.children.push(itemInfo);
        }

    }

    global.xmppClient.response(stanza, elementGetConfigs);
}