var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][GetStorageItems]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}	

	global.xmppClient.response(stanza, new ltxElement("get_storage_items"));
}