var socket = require('./socket')
var xmppStanza = require('./stanza')
var crypto = require('crypto')

exports.create = function (listenerId, listenerHost, listenerPort, listenerDomain) {
	var listenerType = 1;
	var listenerQueryId = 1;

	socket.create(listenerDomain, false, null, null, listenerType, listenerId, -1, function (server) {

		server.on('connect', function (connection) {

			connection.isPlainStreamStarted = false;
			connection.isAuthProcessStarted = false;

			console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:Connect");

			connection.on('streamStart', function (attrs) {
				console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Info]:StreamStart");

				if (attrs["xmlns:stream"] == "http://etherx.jabber.org/streams") {
					if (connection.isPlainStreamStarted == false) {
						connection.streamid = String(listenerQueryId);
						connection.username = attrs.to;
						listenerQueryId++;
						connection.isPlainStreamStarted = true;
						connection.send("<stream:stream xmlns:stream='http://etherx.jabber.org/streams' xmlns='jabber:component:accept' from='" + connection.username + "' id='" + connection.streamid + "'>");
					} else {
						console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Plain stream already started");
						connection.sendEnd("<stream:error><xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
					}
				} else {
					console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Invalid namespace");
					connection.sendEnd("<stream:error><invalid-namespace xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
				}
			});

			connection.on('stanza', function (stanza) {
				//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:Stanza");

				if (connection.isPlainStreamStarted == true) {
					if (connection.isOnline == true) {
						xmppStanza.module(connection, stanza);
					} else if (connection.isAuthProcessStarted == false && stanza.name == "handshake") {
						connection.isAuthProcessStarted = true;

						var conmponentInfo = global.config.componentsInfo[connection.username];
						if (conmponentInfo != null && crypto.createHash("sha1").update(connection.streamid + conmponentInfo, "binary").digest("hex") == stanza.getText()) {

							connection.jid = connection.username;
							connection.isOnline = true;

							if (global.connectionsOnline[connection.jid] != null) {
								var remoteConnection = global.connectionsOnline[connection.jid];
								console.log("[" + remoteConnection.listenerType + "][" + remoteConnection.listenerId + "][" + remoteConnection.ip + ":" + remoteConnection.port + "][" + remoteConnection.jid + "][Error]:Conflict");
								global.connectionsOnline[connection.jid].sendEnd("<stream:error><conflict xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
							}

							global.connectionsOnline[connection.jid] = connection;

							connection.send("<handshake/>");

							connection.authFullFinish();
						} else {
							console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Handshake failed");
							connection.sendEnd("<stream:error><not-authorized/></stream:error>");
						}
					} else {
						console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Invalid stanza state");
						connection.sendEnd("<stream:error><xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/></stream:error>");
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