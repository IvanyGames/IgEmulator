const Element = require('ltx').Element;
const moduleStanza = require('../stanza');

exports.module = function (connection, stanza) {
	switch(stanza.attrs.type){
		case 'get':
			switch(stanza.name){
				case "iq":
					switch(stanza.attrs.xmlns){
						case "jabber:client":
							if(stanza.children[0] != null){
								switch(stanza.children[0].name){
									case "query":
										switch(stanza.children[0].attrs.xmlns){
											case "urn:cryonline:k01":
												if(stanza.children[0].children[0] != null){
													switch(stanza.children[0].children[0].name){
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

function handlerQueryCheckNickname(connection, stanza){
	if(global.masterserversArr.length > 0){
		stanza.attrs.to = global.masterserversArr[Math.floor(Math.random() * global.masterserversArr.length)].jid;
		moduleStanza.module(connection, stanza);
	}
}

function handlerQueryItems(connection, stanza){
	if(global.masterserversArr.length > 0){
		stanza.attrs.to = global.masterserversArr[Math.floor(Math.random() * global.masterserversArr.length)].jid;
		moduleStanza.module(connection, stanza);
	}
}

function handlerQueryShopGetOffers(connection, stanza){
	if(global.masterserversArr.length > 0){
		stanza.attrs.to = global.masterserversArr[Math.floor(Math.random() * global.masterserversArr.length)].jid;
		moduleStanza.module(connection, stanza);
	}
}