var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][GetPlayerStats]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var elementGetPlayerStats = new ltxElement("get_player_stats");

	for (var i = 0; i < profileObject.stats.length; i++) {
		if (profileObject.stats[i].Value) {
			elementGetPlayerStats.c("stat", profileObject.stats[i]);
		}
	}

	global.xmppClient.response(stanza, new ltxElement("get_player_stats"));
	global.xmppClient.request(stanza.attrs.from, elementGetPlayerStats);
}