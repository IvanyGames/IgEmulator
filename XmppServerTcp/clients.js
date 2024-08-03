var Element = require('./element.js')
var crypto = require('crypto')
var socket = require('./socket')
var xmppStanza = require('./stanza')

//Механизмы авторизации
var mechanismsClient = {
	"PLAIN": mechanismPlainAuth
};

function mechanismPlainAuth(connection, stanza) {
	var b64Data = stanza.getText();
	if (b64Data != null) {
		var authData = String(Buffer.from(b64Data, 'base64'));
		var authDataArr = authData.split("\x00");
		var authLogin = authDataArr[1];
		//var authPassword = authDataArr[2];
		
		var authPassword;
		var authVersion;

		var authPasswordSplited = authDataArr[2].split("~");

		if (authPasswordSplited.length == 2) {
			authVersion = authPasswordSplited[0];
			authPassword = authPasswordSplited[1];
		} else {
			authPassword = authDataArr[2];
		}

		console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:AuthInfo login:" + authLogin + " password:" + authPassword);
		if (authLogin != null && authPassword != null) {
			var accountData = null;
			var isUseToken = false;
			var isUseActiveToken = false;

			var userOnlineConnection;
			if (global.config.authByActiveTokenEnable == true) {
				userOnlineConnection = global.connectionsOnline[authLogin + "@" + connection.host + "/GameClient"];
			}
			//Поиск активного токена
			if (userOnlineConnection != null && userOnlineConnection.isOnline == true && userOnlineConnection.byActiveToken == false && authLogin + "#" + userOnlineConnection.active_token == authPassword) {
				accountData = { password: authLogin + "#" + userOnlineConnection.active_token, allowBindCustomResource: false, admin: false, error: null };
				isUseActiveToken = true;
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:Auth by ActiveToken");
			} else if (accountData == null && global.config.localAccounts[authLogin] != null) {//Поиск в статичных аккаунтах
				accountData = global.config.localAccounts[authLogin];
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:Auth by LocalAccount");
			} else if (global.clientTokens[authLogin] != null) {//Поиск во временных токенах
				accountData = global.clientTokens[authLogin];
				isUseToken = true;
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:Auth by Token");
			}

			//Разрешение авторизации под любым логином или паролем.Использовать только для отладки!!!
			if (global.config.authAllowAnyone == true && accountData == null) {
				accountData = { password: authPassword, allowBindCustomResource: false, admin: false, error: null };
			}

			if (accountData != null) {
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:AuthInfoAccount login:" + authLogin + " password:" + accountData.password);
			}

			if (accountData != null && (accountData.password == authPassword || accountData.password + "{:B:}trunk" == authPassword)) {
				if (accountData.error == null) {
					connection.username = authLogin;
					connection.password = authPassword;
					connection.version = authVersion;
					if (accountData.allowBindCustomResource == true) {
						connection.isAllowBindCustomResource = true;
					}
					if (accountData.admin == true) {
						connection.isAdmin = true;
					}
					connection.isAuthorized = true;
					connection.jid = connection.username + "@" + connection.host;//???

					//Генерация активного токена, если авторизация была произведена не по активному токену
					if (isUseActiveToken == true) {
						connection.byActiveToken = true;
						connection.active_token = " ";
					} else {
						connection.byActiveToken = false;
						var aTokenL = authLogin + "_" + new Date().getTime();
						connection.active_token = "$WF_" + aTokenL + "_" + crypto.createHash('md5').update(aTokenL + "_" + authPassword).digest("hex");
					}
					connection.send("<success xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>");
				} else {
					console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Account banned");
					connection.sendEnd("<failure xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><warface-failure>&lt;error&gt;&lt;code&gt;" + accountData.error.code + "&lt;/code&gt;&lt;message&gt;" + accountData.error.message + "&lt;/message&gt;&lt;unbantime&gt;" + accountData.error.unbantime + "&lt;/unbantime&gt;&lt;/error&gt;</warface-failure></failure>");
				}

				//Очистка таймера, удаление токена
				if (isUseToken == true) {
					clearTimeout(accountData.timer);
					delete global.clientTokens[authLogin];
				}
			} else {
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Incorrect account or password");
				connection.sendEnd("<failure xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><not-authorized/></failure>");
			}

		} else {
			console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Incorrect auth base64 data");
			connection.sendEnd("<failure xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><incorrect-encoding/></failure>");
		}
	} else {
		console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:No base64 data");
		connection.sendEnd("<stream:error><xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
	}
}

exports.create = function (listenerId, listenerHost, listenerPort, listenerDomain, listenerTlsUse, listenerTlsRequire, listenerTlsKey, listenerTlsCert, listenerSocketSpeedLimit) {
	var listenerType = 0;
	var listenerQueryId = 1;
	var NoResourceId = 1;

	socket.create(listenerDomain, listenerTlsUse, listenerTlsKey, listenerTlsCert, listenerType, listenerId, listenerSocketSpeedLimit, function (server) {

		//Установка параметра starttls если tls включено
		var sTlsText = "";
		if (listenerTlsUse == true) {
			sTlsText = "<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>";
		}

		//Создание списака потдерживаемых механизмов
		var sMechanismsText = "";

		for (var key in mechanismsClient) {
			sMechanismsText += "<mechanism>" + key + "</mechanism>"
		}

		server.on('connect', function (connection) {

			connection.isPlainStreamStarted = false;
			connection.isTlsStarted = false;
			connection.isTwoStreamStarted = false;
			connection.isAuthProcessStarted = false;

			connection.username = null;

			connection.isAllowBindCustomResource = false;
			connection.isAdmin = false;
			connection.isAuthorized = false;
			connection.isThreeStreamStarted = false;
			connection.isBinded = false;

			console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:Connect");

			connection.on('streamStart', function (attrs) {
				//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:StreamStart");
				if (attrs["xmlns:stream"] == "http://etherx.jabber.org/streams") {
					if (attrs.to == listenerDomain) {
						if (connection.isPlainStreamStarted == false) {
							connection.isPlainStreamStarted = true;
							connection.send("<?xml version='1.0'?><stream:stream xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' id='" + listenerQueryId + "' from='" + listenerDomain + "' version='1.0' xml:lang='en'><stream:features>" + sTlsText + "<mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>" + sMechanismsText + "</mechanisms></stream:features>");
							listenerQueryId++;
						} else if (connection.isTwoStreamStarted == false && connection.isTlsStarted == true) {
							connection.isTwoStreamStarted = true;
							connection.send("<?xml version='1.0'?><stream:stream xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' id='" + listenerQueryId + "' from='" + listenerDomain + "' version='1.0' xml:lang='en'><stream:features><mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>" + sMechanismsText + "</mechanisms></stream:features>");
							listenerQueryId++;
						} else if (connection.isThreeStreamStarted == false && connection.isAuthorized == true) {
							connection.isThreeStreamStarted = true;
							connection.send("<?xml version='1.0'?><stream:stream xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' id='" + listenerQueryId + "' from='" + listenerDomain + "' version='1.0' xml:lang='en'><stream:features><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/><session xmlns='urn:ietf:params:xml:ns:xmpp-session'/></stream:features>");
							listenerQueryId++;
						} else {
							console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Unknown streamstart state");
							connection.sendEnd("<stream:error><xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
						}
					} else {
						console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Host '" + attrs.to + "' is unknown");
						connection.sendEnd("<stream:error><host-unknown xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
					}
				} else {
					console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Invalid namespace");
					connection.sendEnd("<stream:error><invalid-namespace xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
				}
			});

			connection.on('stanza', function (stanza) {
				//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:Stanza");
				//console.log(String(stanza)+"\n");
				if (connection.isPlainStreamStarted == true) {
					if (listenerTlsUse == false || listenerTlsRequire == false || connection.isTlsStarted == true || stanza.name == "starttls") {
						if (connection.isOnline == true) {
							//console.time("clientStanza");
							xmppStanza.module(connection, stanza);
							//console.timeEnd("clientStanza");
						} else if (stanza.name == "iq" && stanza.children[0] != null && stanza.children[0].name == "session" && connection.isBinded == true) {
							connection.isOnline = true;

							if (global.connectionsOnline[connection.jid] != null) {
								var remoteConnection = global.connectionsOnline[connection.jid];
								console.log("[" + remoteConnection.listenerType + "][" + remoteConnection.listenerId + "][" + remoteConnection.ip + ":" + remoteConnection.port + "][" + remoteConnection.jid + "][Error]:Conflict");
								global.connectionsOnline[connection.jid].sendEnd("<stream:error><conflict xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
							}

							global.connectionsOnline[connection.jid] = connection;

							var cIqSession = new Element("iq", { type: "result", to: connection.jid, id: stanza.attrs.id, xmlns: "jabber:client" });
							cIqSession.c("session", { xmlns: "urn:ietf:params:xml:ns:xmpp-session" });
							connection.send(String(cIqSession));

							connection.authFullFinish();
						} else if (stanza.name == "iq" && stanza.children[0] != null && stanza.children[0].name == "bind" && connection.isThreeStreamStarted == true && connection.isBinded == false) {
							var resourceToSet = "";

							//Если пользователю разрешён бинд кастомного ресурса то биндим,если нет то GameClient
							if (connection.isAllowBindCustomResource == true) {
								var cResource = stanza.children[0].getChild("resource");
								if (cResource != null) {
									resourceToSet = cResource.getText();
								}
								//Если ресурс null или пустота, то генерируем уникальный ресурс.
								if (resourceToSet == null || resourceToSet == "" || (connection.username == "dedicated" && resourceToSet == "GameClient")) {
									resourceToSet = String(NoResourceId);
									NoResourceId++;
								}
							} else if (connection.byActiveToken == true) {
								resourceToSet = "dedicated";
							} else {
								resourceToSet = "GameClient";
							}

							connection.jid = connection.username + "@" + connection.host + "/" + resourceToSet;//???

							connection.isBinded = true;

							var cIqBind = new Element("iq", { id: stanza.attrs.id, type: "result" });
							cIqBind.c("bind", { xmlns: "urn:ietf:params:xml:ns:xmpp-bind" }).c("jid").t(connection.jid);
							connection.send(String(cIqBind));

						} else if (stanza.name == "auth" && connection.isAuthProcessStarted == false && (connection.isTlsStarted == false || connection.isTwoStreamStarted == true)) {
							connection.isAuthProcessStarted = true;

							if (stanza.attrs.mechanism != null && mechanismsClient[stanza.attrs.mechanism] != null) {
								mechanismsClient[stanza.attrs.mechanism](connection, stanza);
							} else {
								console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Invalid sasl mechanism");
								connection.sendEnd("<failure xmlns='urn:ietf:params:xml:ns:xmpp-sasl'><invalid-mechanism/></failure>");
							}
						} else if (stanza.name == "starttls") {
							if (listenerTlsUse == true && connection.isTlsStarted == false) {
								connection.send("<proceed xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>", function () {
									connection.StartTls();
									connection.isTlsStarted = true;
								});
							} else {
								console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Tls already started or disabled");
								connection.sendEnd("<failure xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>");
							}
						} else {
							console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Invalid stanza state");
							connection.sendEnd("<stream:error><xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
						}
					} else {
						console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Require tls");
						connection.sendEnd("<stream:error><policy-violation xmlns='urn:ietf:params:xml:ns:xmpp-streams'/><text xml:lang='en' xmlns='urn:ietf:params:xml:ns:xmpp-streams'>Use of STARTTLS required</text></stream:error>");
					}

				} else {
					console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Plain stream is not started");
					connection.sendEnd("<stream:error><xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
				}
			});

			connection.on('disconnect', function () {
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:Disconnect");
				if (global.connectionsOnline[connection.jid] != null && global.connectionsOnline[connection.jid].ip == connection.ip && global.connectionsOnline[connection.jid].port == connection.port) {
					delete global.connectionsOnline[connection.jid];
					//Так-же закрываем второе соединение, если оно есть.
					var activeOnlineConnection = global.connectionsOnline[connection.username + "@" + connection.host + "/dedicated"];
					if (activeOnlineConnection != null) {
						activeOnlineConnection.sendEnd("");
					}

					//Если пользователь отключается то отправлять инфу в k01 если он есть
					if (connection.isOnline == true && connection.username != "masterserver") {
						for (var i = 0; i < global.masterserversArr.length; i++) {
							
							if (connection.version && connection.version != global.masterserversArr[i].info.version) {
								continue;
							}

							var masterserverJid = global.masterserversArr[i].jid;
							var masterserverConnection = global.connectionsOnline[masterserverJid];

							if (masterserverConnection) {
								masterserverConnection.send("<iq to='" + masterserverJid + "' type='get' from='" + connection.jid + "' xmlns='jabber:client'><query xmlns='urn:cryonline:k01'><user_logout/></query></iq>");
							}
						}
					}
				}
			});
		});

		server.on('error', function (err) {
			console.log("[Listener][" + listenerType + "][" + listenerId + "]:Error");
			throw err;
		});

		server.listen(listenerPort, listenerHost, function () {
			console.log("[Listener][" + listenerType + "][" + listenerId + "][" + listenerHost + ":" + listenerPort + "]:Listen");
		});
	});
}