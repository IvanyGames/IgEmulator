var EventEmitter = require('events').EventEmitter;
var net = require('net')
var tls = require('tls')
var fs = require('fs')
var StreamParser = require('./parser.js');

exports.create = function (aXmppHost, aUseTls, aTlsKey, aTlsCert, aListenerType, aListenerId, aSocketSpeedLimit, aCallback) {
	var tlsCert = null;
	if (aUseTls == true) {
		const vTlsKey = fs.readFileSync(aTlsKey, 'ascii');
		const vTlsCert = fs.readFileSync(aTlsCert, 'ascii');

		tlsCert = tls.createSecureContext({
			key: vTlsKey,
			cert: vTlsCert,
			ciphers: "DEFAULT:@SECLEVEL=0"
		});
	}

	var server = net.createServer(function (socket) {
		var connection = new EventEmitter();

		connection.ip = socket.remoteAddress;
		connection.port = socket.remotePort;

		connection.socket = socket;
		connection.socketTls = null;

		connection.jid = null;
		connection.isOnline = false;

		connection.listenerType = aListenerType;
		connection.listenerId = aListenerId;
		connection.host = aXmppHost;

		connection.unauthTimer = setTimeout(disconnectUnauthorizedConnectionByTimeout, global.config.connectionsUnauthorizedTimeout * 1000, connection);

		connection.pingTimer = null;
		connection.pingId = 0;
		connection.pingTime = -1;

		connection.speedLimiterTickTime = 0;
		connection.speedLimiterTotalBytes = 0;


		//Эта функция ограничивает количество байт в секунду, которое может быть получено от клиента.
		//Суть её работы в том, что она вызвается как только приходят данные от клиента, и проверяет что-бы за секунду от клиента не пришло больше данных чем указано в конфиге, если данных пришло больше, то она останавливает получение данных от клиента на время, которое вычисляется по формуле (((ОбщееКоличетвоПолученныхБайтЗаСекунду-ЛимитКоличестваБайтЗаСекунду)/ЛимитКоличестваБайтЗаСекунду)*1000)+(1000-(ТекущееВремя-ВремяКогдаСекундаЗакончится)) 
		connection.speedLimiterUpdate = function (readBytes) {
			var currentTime = new Date().getTime();
			//Анулируем количество полученных байт и таймер если с момента последней очистки прошло больше чем 1 секунда
			if (currentTime - connection.speedLimiterTickTime > 1000) {
				connection.speedLimiterTickTime = currentTime;
				connection.speedLimiterTotalBytes = 0;
				//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:SpeedLimiter Cleared");
			}

			connection.speedLimiterTotalBytes = connection.speedLimiterTotalBytes + readBytes;

			//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:SpeedLimiter speed:"+connection.speedLimiterTotalBytes+"b/s");
			if (connection.speedLimiterTotalBytes > aSocketSpeedLimit) {

				var sockWaitTime = (((connection.speedLimiterTotalBytes - aSocketSpeedLimit) / aSocketSpeedLimit) * 1000) + (1000 - (currentTime - connection.speedLimiterTickTime));

				if (connection.socketTls != null) {
					connection.socketTls.pause();
				} else {
					connection.socket.pause();
				}

				setTimeout(() => {
					if (connection.socketTls != null) {
						connection.socketTls.resume()
					} else {
						connection.socket.resume()
					}
				}, sockWaitTime);

				//console.log("["+connection.listenerType+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:SpeedLimiter Limit time:"+sockWaitTime+" ms");
			}
		}

		//Stream Parser
		var streamParser = new StreamParser();

		streamParser.onStreamStart = function (name, attrs) {
			connection.emit("streamStart", attrs);
		};

		streamParser.onStanza = function (stanza) {
			//console.log("[Stanza]:Input");
			//console.log(stanza + "\n");
			try {
				//fs.appendFileSync("./XmppServerLog.xml", "[" + new Date().toLocaleString() + "] Input-> " + stanza + "\n");
			} catch (e) {

			}
			connection.emit("stanza", stanza);
		};

		streamParser.onError = function (err) {
			switch (err) {
				case 1:
					connection.sendEnd("<xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/>");
					break;
				case 2:
					connection.sendEnd("<stream:error><policy-violation xmlns='urn:ietf:params:xml:ns:xmpp-streams'/><stanza-too-big xmlns='urn:xmpp:errors'/></stream:error>");
					break;
				default:
					connection.sendEnd("<xml-not-well-formed xmlns='urn:ietf:params:xml:ns:xmpp-streams'/>");
			}
		};

		streamParser.onStreamEnd = function () {
			connection.Close();
		};

		connection.send = function (data, callback) {
			//console.log("[Stanza]:Output");
			//console.log(data + "\n");
			try {
				//fs.appendFileSync("./XmppServerLog.xml", "[" + new Date().toLocaleString() + "] Output-> " + data + "\n");
			} catch (e) {

			}
			if (connection.socketTls != null) {
				connection.socketTls.write(data, "utf8", callback);
			} else {
				connection.socket.write(data, "utf8", callback);
			}
		}

		if (aUseTls == true) {
			//console.log(connection.socket.getSharedSigalgs())
			connection.StartTls = function () {
				connection.socketTls = new tls.TLSSocket(connection.socket, {
					credentials: tlsCert,
					isServer: true,
					requestCert: false,
					rejectUnauthorized: false,
					NPNProtocols: null
				});
				//console.log(connection.socketTls.getCipher())
				connection.socketTls.on('data', function (data) {
					//console.log("[RawTls]:Input");
					//console.log(data+"\n");					

					//console.log(connection.socketTls.getCipher())
					streamParser.write(data);
					if (aSocketSpeedLimit > 0) {
						connection.speedLimiterUpdate(data.length);
					}
				});

				connection.socketTls.on('close', function () {

				})

				connection.socketTls.on('error', function (err) {
					//console.log(connection.socketTls.getSharedSigalgs())
					//console.log(err);
				})
				//console.log(connection.socketTls.getSharedSigalgs())

			}
		}
		connection.Close = function () {
			if (connection.socketTls != null) {
				connection.socketTls.destroy();
			}
			connection.socket.destroy();
		}
		connection.authFullFinish = function () {

			clearTimeout(connection.unauthTimer);
			connection.unauthTimer = null;

			if (global.config.pingEnable == true) {
				connection.pingTimer = setInterval(pingSend, global.config.pingInterval * 1000, connection);
			}
		}

		connection.sendEnd = function (data) {
			if (data != null && data != "") {
				connection.send(data);
			}
			connection.send("</stream:stream>");
			connection.Close();
		}

		connection.socket.on('data', function (data) {

			//console.log("[Raw]:Input");
			//console.log(data+"\n");				

			streamParser.write(data);
			if (aSocketSpeedLimit > 0) {
				connection.speedLimiterUpdate(data.length);
			}
		})

		connection.socket.on('close', function () {
			if (connection.unauthTimer != null) {
				clearTimeout(connection.unauthTimer);
			}

			if (connection.pingTimer != null) {
				clearInterval(connection.pingTimer);
			}

			//streamParser.end();
			connection.emit("disconnect");
		})

		connection.socket.on('error', function (err) {

		});

		server.emit("connect", connection);

		//connection.socket.setTimeout(5000);
	});
	aCallback(server);
}

function disconnectUnauthorizedConnectionByTimeout(connection) {
	if (connection != null) {
		console.log("[" + connection.listenerType + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Unauthorized connection timeout");
		connection.Close();
	}
}

function pingSend(connection) {
	connection.pingId++;
	connection.send("<iq type='get' to='" + connection.jid + "' id='ping" + connection.pingId + "' from='" + connection.host + "' xmlns:stream='http://etherx.jabber.org/streams'><ping xmlns='urn:xmpp:ping'/></iq>");
	connection.pingTime = new Date().getTime();
}