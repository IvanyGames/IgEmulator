var componentWarface = require('./warface.js');
var componentK01 = require('./k01.js');
var componentMS = require('./ms.js');

exports.module = function (connection, stanza) {

	if (connection.listenerType == 0 || stanza.attrs.from == null) {
		stanza.attrs.from = connection.jid;
	}

	switch (stanza.attrs.to) {
		case undefined:
			stanza.attrs.to = connection.host;
			componentWarface.module(connection, stanza);
			return;
			break;
		case connection.host:
			componentWarface.module(connection, stanza);
			return;
			break;
		case "k01." + connection.host:
			componentK01.module(connection, stanza);
			return;
			break;
		case "ms." + connection.host:
			componentMS.module(connection, stanza);
			return;
			break;
	}

	var TargetConnection = global.connectionsOnline[stanza.attrs.to];
	if (TargetConnection != null && TargetConnection.isOnline == true) {
		TargetConnection.send(String(stanza));
	} else if ((stanza.name == "presence" || stanza.name == "message" || (stanza.name == "iq" && stanza.children[0] != null && stanza.children[0].name == "query" && stanza.children[0].attrs.xmlns == "http://jabber.org/protocol/disco#items")) && stanza.attrs.to.split("@")[1] != null && connectionsOnline[stanza.attrs.to.split("@")[1].split("/")[0]] != null && connectionsOnline[stanza.attrs.to.split("@")[1].split("/")[0]].isOnline == true) {
		global.connectionsOnline[stanza.attrs.to.split("@")[1].split("/")[0]].send(String(stanza));
	} else if (stanza.attrs.type != "result") {
		var AttrFrom = stanza.attrs.from
		stanza.attrs.from = stanza.attrs.to;
		stanza.attrs.to = AttrFrom;
		stanza.attrs.type = "error";
		var error_c = stanza.c("error", { type: "cancel", code: "503" });
		error_c.c("service-unavailable", { xmlns: "urn:ietf:params:xml:ns:xmpp-stanzas" });
		connection.send(String(stanza));
	}
}