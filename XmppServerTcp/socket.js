const EventEmitter = require('events').EventEmitter;
const net = require('net')
const tls = require('tls')
const fs = require('fs')
const StreamParser = require('./streamparser')
const listenerTypes = require('./listenerTypes')

exports.create = function (aXmppHost, aUseTls, aTlsPfx, aListenerType, aListenerId, aSocketSpeedLimit, aSocketProtect, aCallback) {
	var tlsCert = null;
	if (aUseTls == true) {
		tlsCert = tls.createSecureContext({
			pfx: fs.readFileSync(aTlsPfx),
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
		connection.inactivityTimer = null;
		connection.activityLastTime = Math.round(new Date().getTime() / 1000);

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
				//console.log("["+listenerTypes[connection.listenerType]+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:SpeedLimiter Cleared");
			}

			connection.speedLimiterTotalBytes = connection.speedLimiterTotalBytes + readBytes;

			//console.log("["+listenerTypes[connection.listenerType]+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:SpeedLimiter speed:"+connection.speedLimiterTotalBytes+"b/s");
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

				//console.log("["+listenerTypes[connection.listenerType]+"]["+connection.listenerId+"][" + connection.ip +":"+ connection.port+"]["+connection.jid+"][Info]:SpeedLimiter Limit time:"+sockWaitTime+" ms");
			}
		}

		//Stream Parser
		var streamParser = new StreamParser();

		streamParser.on('streamStart', function (attrs) {
			connection.emit("streamStart", attrs);
			//console.log(attrs);
		})

		streamParser.on('stanza', function (stanza) {
			//console.log("[Stanza]:Input");
			//console.log(stanza + "\n");
			//fs.appendFileSync("./XmppServerLog.xml", "[" + new Date().toLocaleString() + "][" + connection.ip + ":" + connection.port + "] Input-> " + stanza + "\n");
			connection.emit("stanza", stanza);
		});

		streamParser.on('error', function (err) {
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
		});

		//streamParser.on('end', function () {
		//	connection.Close();
		//});			

		streamParser.on('endElement', function () {
			connection.Close();
		});
		connection.send = function (data, callback) {
			//console.log("[Stanza]:Output");
			//console.log(data + "\n");

			//fs.appendFileSync("./XmppServerLog.xml", "[" + new Date().toLocaleString() + "][" + connection.ip + ":" + connection.port + "] Output-> " + data + "\n");

			var sendBuffer;

			if (aSocketProtect) {
				var dataSize = Buffer.byteLength(data);
				sendBuffer = Buffer.alloc(dataSize + 12);
				sendBuffer.writeUint32LE(4277001901, 0);
				sendBuffer.writeUint32LE(dataSize, 4);
				sendBuffer.writeUint32LE(0, 8);
				sendBuffer.write(data, 12);
			} else {
				sendBuffer = data;
			}
			
			if (connection.socketTls != null) {
				//fs.appendFileSync("./TcpServerLog.xml", "[" + new Date().toLocaleString() + "][" + connection.ip + ":" + connection.port + "] OutputTls-> " + data + "\n");
				connection.socketTls.write(sendBuffer, "utf8", callback);
			} else {
				//fs.appendFileSync("./TcpServerLog.xml", "[" + new Date().toLocaleString() + "][" + connection.ip + ":" + connection.port + "] Output-> " + data + "\n");
				connection.socket.write(sendBuffer, "utf8", callback);
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
					//console.log(connection.socketTls.getCipher())
					//fs.appendFileSync("./TcpServerLog.xml", "[" + new Date().toLocaleString() + "][" + connection.ip + ":" + connection.port + "] InputTls-> " + data + "\n");
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

			if (global.config.connectionsInactivityCheckEnable == true) {
				connection.inactivityTimer = setInterval(inactivityCheck, global.config.connectionsInactivityCheckInterval * 1000, connection);
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
			//fs.appendFileSync("./TcpServerLog.xml", "[" + new Date().toLocaleString() + "][" + connection.ip + ":" + connection.port + "] Input-> " + data + "\n");
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

			if (connection.inactivityTimer != null) {
				clearInterval(connection.inactivityTimer);
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
		console.log("[" + listenerTypes[connection.listenerType] + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Unauthorized connection timeout");
		connection.Close();
	}
}

function pingSend(connection) {
	connection.pingId++;
	connection.send("<iq type='get' to='" + connection.jid + "' id='ping" + connection.pingId + "' from='" + connection.host + "' xmlns:stream='http://etherx.jabber.org/streams'><ping xmlns='urn:xmpp:ping'/></iq>");
	connection.pingTime = new Date().getTime();
}

function inactivityCheck(connection) {
	var curentTime = Math.round(new Date().getTime() / 1000);
	if ((curentTime - connection.activityLastTime) > global.config.connectionsInactivityCheckTimeout) {
		console.log("[" + listenerTypes[connection.listenerType] + "][" + connection.listenerId + "][" + connection.ip + ":" + connection.port + "][" + connection.jid + "][Error]:Inactivity check timeout");
		connection.Close();
	}
}