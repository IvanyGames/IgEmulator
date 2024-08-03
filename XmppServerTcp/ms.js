var moduleStanza = require('./stanza');

exports.module = function (connection, stanza) {
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
											case "urn:cryonline:k01":
												if (stanza.children[0].children[0] != null) {
													switch (stanza.children[0].children[0].name) {
														case "items":
															handlerQueryItems(connection, stanza);
															break;
														case "shop_get_offers":
															handlerQueryShopGetOffers(connection, stanza);
															break;
														case "check_nickname":
															handlerQueryCheckNickname(connection, stanza);
															break;
													}
												}
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
	}
}

function handlerQueryCheckNickname(connection, stanza) {
	var masterserversJidsArr = [];

	for (var i = 0; i < global.masterserversArr.length; i++) {

		if (connection.version && connection.version != global.masterserversArr[i].info.version) {
			continue;
		}

		masterserversJidsArr.push(global.masterserversArr[i].jid);
	}

	if (masterserversJidsArr.length > 0) {
		stanza.attrs.to = masterserversJidsArr[Math.floor(Math.random() * masterserversJidsArr.length)];
		moduleStanza.module(connection, stanza);
	}
}

function handlerQueryItems(connection, stanza) {
	var masterserversJidsArr = [];

	for (var i = 0; i < global.masterserversArr.length; i++) {

		if (connection.version && connection.version != global.masterserversArr[i].info.version) {
			continue;
		}

		masterserversJidsArr.push(global.masterserversArr[i].jid);
	}

	if (masterserversJidsArr.length > 0) {
		stanza.attrs.to = masterserversJidsArr[Math.floor(Math.random() * masterserversJidsArr.length)];
		moduleStanza.module(connection, stanza);
	}
}

function handlerQueryShopGetOffers(connection, stanza) {
	var masterserversJidsArr = [];

	for (var i = 0; i < global.masterserversArr.length; i++) {

		if (connection.version && connection.version != global.masterserversArr[i].info.version) {
			continue;
		}

		masterserversJidsArr.push(global.masterserversArr[i].jid);
	}

	if (masterserversJidsArr.length > 0) {
		stanza.attrs.to = masterserversJidsArr[Math.floor(Math.random() * masterserversJidsArr.length)];
		moduleStanza.module(connection, stanza);
	}
}