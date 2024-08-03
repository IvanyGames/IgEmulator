var Element = require('./element.js');

exports.module = function (connection, stanza) {
	//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:Warface");

	switch (stanza.attrs.type) {
		case 'get':
			switch (stanza.name) {
				case "iq":
					switch (stanza.attrs.xmlns) {
						case "jabber:client":
							if (stanza.children[0] != null) {
								switch (stanza.children[0].name) {
									case "query":
										switch (stanza.children[0].attrs.xmlns) {
											case "jabber:iq:private":
												if (stanza.children[0].children[0] != null) {
													switch (stanza.children[0].children[0].name) {
														case "roster":
															switch (stanza.children[0].children[0].attrs.xmlns) {
																case "roster:delimiter":
																	var res_err = new Element('iq', { "id": stanza.attrs.id, type: 'error', from: stanza.attrs.to, xmlns: "jabber:client", "to": stanza.attrs.from });
																	res_err.c(stanza.children[0].name, stanza.children[0].attrs).c(stanza.children[0].children[0].name, stanza.children[0].children[0].attrs);
																	res_err.c('error', { type: "cancel", code: "503" }).c('service-unavailable', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas' });
																	connection.send(String(res_err));
																	break;
															}
															break;
													}
												}
												break;

											case "jabber:iq:roster":
												var res_err = new Element('iq', { "id": stanza.attrs.id, type: 'error', from: stanza.attrs.to, xmlns: "jabber:client", "to": stanza.attrs.from });
												res_err.c(stanza.children[0].name, stanza.children[0].attrs)
												res_err.c('error', { type: "cancel", code: "503" }).c('service-unavailable', { xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas' });
												connection.send(String(res_err));
												break;
										}
										break;

								}
							}
							break;

					}
					break;

			}
			break;

		case 'result':
			switch (stanza.name) {
				case "iq":
					switch (stanza.xmlns) {
						case "jabber:client":
							if (global.config.pingEnable == true && connection.pingTime != -1 && stanza.attrs.id != null && stanza.attrs.id == "ping" + connection.pingId) {
								var pingResult = new Date().getTime() - connection.pingTime;
								//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:Ping "+pingResult+" ms");
								connection.pingTime = -1;
								if (global.config.pingAnonceToMasterservers == true && connection.listenerType == 0 && connection.username != "masterserver" && connection.username != "dedicated") {
									for (var keyConnection in global.connectionsOnline) {
										var curConnection = global.connectionsOnline[keyConnection];
										if (curConnection.isOnline == true && curConnection.username == "masterserver") {
											curConnection.send("<iq to='" + keyConnection + "' type='get' from='" + keyConnection.host + "' xmlns='jabber:client'><query xmlns='urn:cryonline:k01'><user_ping jid='" + connection.jid + "' ping='" + pingResult + "'/></query></iq>");
										}
									}
								}
							}
							break

					}
					break;

			}
			break;

	}
}