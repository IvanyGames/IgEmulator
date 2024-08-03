var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][SetCurrentClass]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var current_class = Number(stanza.children[0].children[0].attrs.current_class);

	if (profileObject.classes_unlocked.indexOf(current_class) == -1) {
		//console.log("["+stanza.attrs.from+"][SetCurrentClass]:Incorrect class Id");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	profileObject.current_class = current_class;

	global.xmppClient.response(stanza, new ltxElement("setcurrentclass"));
}