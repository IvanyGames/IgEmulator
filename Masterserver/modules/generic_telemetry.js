var ltxElement = require('ltx').Element

exports.module = function (stanza) {
	global.xmppClient.response(stanza, new ltxElement("generic_telemetry"));
}