var ltxElement = require('ltx').Element

exports.module = function (stanza) {
	global.xmppClient.responseError(stanza, { type: 'continue', code: '8', custom_code: '5' });
}
