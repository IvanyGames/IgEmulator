const net = require('net')

global.clientTokens = {};

exports.create = function () {
	var host = global.config.api.host;
	var port = global.config.api.port;
	var allowedAddresses = global.config.api.allowedIps;

	var server = net.createServer(function (socket) {
		//console.log("[HttpApi]["+socket.remoteAddress+":"+socket.remotePort+"][Connect]");
		socket.on('data', function (data) {
			//console.log(data);
			//console.time("t");
			//console.log("[HttpApi]["+socket.remoteAddress+":"+socket.remotePort+"][Data]");
			//Отделение заголовка от post и других данных
			var sHeaderAndData = String(data).split("\r\n\r\n");
			//Разделение заголовка на части
			var sHeaderData = sHeaderAndData[0].split("\r\n");
			//Разделение первой строки загловка через пробел
			var UrlData = sHeaderData[0].split(" ");
			//Деколировка url
			UrlData[1] = decodeURIComponent(UrlData[1]);
			//Отделение url от параметров запроса
			var UrlAndAttrs = UrlData[1].split("?");
			//Парсинг параметров запроса в json
			var Attrs = {};
			if (UrlAndAttrs[1] != null) {
				var splitedAttrs = UrlAndAttrs[1].split("&");
				for (var i = 0; i < splitedAttrs.length; i++) {
					var sAttr = splitedAttrs[i].split("=");
					if (sAttr.length == 2) {
						Attrs[sAttr[0]] = sAttr[1];
					}
				}
			}

			var request = {
				type: UrlData[0],
				url: UrlAndAttrs[0],
				attrs: Attrs,
				socket: socket
			}
			onRequest(request);
			//console.timeEnd("t");

		})

		socket.on('close', function () {
			//console.log("[HttpApi]["+socket.remoteAddress+":"+socket.remotePort+"][Close]");
		})

		socket.on('error', function (err) {
			//console.log("[HttpApi]["+socket.remoteAddress+":"+socket.remotePort+"][Error]");
		});
	});

	server.on('error', function (err) {
		console.log("[HttpApi][" + host + ":" + port + "][Error]");
		throw err;
	});

	server.listen(port, host, function () {
		console.log("[HttpApi][" + host + ":" + port + "][Listen]");
	});
}

const httpCodes = {
	"200": "OK",
	"404": "Not Found",
	"405": "Method Not Allowed"
}

function sendResponse(request, code, data) {
	//Определение текстового кода состояния
	var textCode = "";
	if (httpCodes[code] != null) {
		textCode = httpCodes[code];
	} else {
		throw "[HttpApi]:Unsupported code " + code;//Если код состояния не найден в httpCodes
	}

	//Определиение типа данных
	switch (typeof data) {
		case "object":
			data = JSON.stringify(data);//Парсинг json в текст
			break;
		case "string":
			//Это и так строка,сдесь нечего не надо делать
			break;
		default:
			throw "[HttpApi]:Unsupported data type " + typeof data;//Если тип переменной data не совпадает не с одним из switch
	}

	request.socket.write("HTTP/1.1 " + code + " " + textCode + "\r\nConnection: close\r\nContent-Length: " + Buffer.byteLength(data, 'utf8') + "\r\n\r\n" + data);
}

function onRequest(request) {
	//console.log(request.attrs);
	switch (request.type) {
		case "GET":
			switch (request.url) {
				case "/settoken":
					handlerSetToken(request);
					break;
				case "/getaccount":
					handlerGetAccount(request);
					break;
				case "/getonline":
					handlerGetOnline(request);
					break;
				case "/kick":
					handlerKick(request);
					break;
				default:
					sendResponse(request, 404, "Not Found");
			}
			break;
		default:
			sendResponse(request, 405, "Method Not Allowed");
	}
}

function handlerSetToken(request) {
	var requestId = Number(request.attrs.id);
	var requestToken = request.attrs.token;
	var requestTime = Number(request.attrs.time);
	if (isNaN(requestId) == false && requestToken != null && isNaN(requestTime) == false) {

		//Добавление error если есть аргументы для него
		var requestErrorCode = Number(request.attrs.error_code);
		var requestErrorMessage = request.attrs.error_message;
		var requestErrorUnbantime = Number(request.attrs.error_unbantime);
		var jsonError = null;
		if (isNaN(requestErrorCode) == false && requestErrorMessage != null && isNaN(requestErrorUnbantime) == false) {
			jsonError = { code: requestErrorCode, message: Buffer.from(requestErrorMessage.split("*").join("=").split("|").join("/"), "base64").toString("utf8"), unbantime: requestErrorUnbantime };
		}

		//Очистка таймера если токен уже есть
		if (global.clientTokens[requestId] != null) {
			console.log("[ClientTokensSystem][" + requestId + "]:Token timeout cleared");
			clearTimeout(global.clientTokens[requestId].timer);
		}

		global.clientTokens[requestId] = { password: requestToken, error: jsonError, timer: setTimeout(timerTokenExpiration, requestTime, requestId) };

		console.log("[ClientTokensSystem][" + requestId + "]:Token updated");

		sendResponse(request, 200, { code: 0 });
	} else {
		sendResponse(request, 200, { code: 1 });
	}
}

function handlerGetAccount(request) {
	var requestJid = request.attrs.jid;
	if (requestJid != null) {
		var connectionInfo = global.connectionsOnline[requestJid];
		if (connectionInfo != null && connectionInfo.isOnline == true) {
			sendResponse(request, 200, { code: 0, username: connectionInfo.username, password: connectionInfo.password, active_token: connectionInfo.active_token });
		} else {
			sendResponse(request, 200, { code: 1 });
		}
	} else {
		sendResponse(request, 200, { code: 2 });
	}
}

function handlerGetOnline(request) {
	var resultOnline = 0;
	for (var connectionJid in global.connectionsOnline) {
		var connection = global.connectionsOnline[connectionJid];
		if (connection.listenerType == 0 && connection.isOnline == true && connectionJid.split("/")[1] == "GameClient") {
			resultOnline++;
		}
	}
	sendResponse(request, 200, { code: 0, online: resultOnline });
}

function timerTokenExpiration(id) {
	if (global.clientTokens[id] != null) {
		console.log("[ClientTokensSystem][" + id + "]:Token expired");
		delete global.clientTokens[id];
	}
}

function handlerKick(request) {

	for (var jid in global.connectionsOnline) {
		var connection = global.connectionsOnline[jid];
		if (connection.isOnline == true && connection.isAuthorized == true && connection.username == request.attrs.username) {
			connection.sendEnd("");
		}
	}

	sendResponse(request, 200, { code: 0 });
}