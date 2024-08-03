if (require('tls').DEFAULT_MIN_VERSION != "TLSv1") {
	console.log("Please use --tls-min-v1.0 in commandline");
	throw "";
}

global.config = require('./config')

global.connectionsOnline = {};

const listenerComponents = require('./listenerComponents')
const listenerClients = require('./listenerClients')
const api = require('./api')

api.create();

for (var i = 0; i < global.config.listenersComponent.length; i++) {
	var listener = global.config.listenersComponent[i];
	listenerComponents.create(i, listener.host, listener.port, listener.domain);
}

for (var i = 0; i < global.config.listenersClient.length; i++) {
	var listener = global.config.listenersClient[i];
	listenerClients.create(i, listener.host, listener.port, listener.domain, listener.tlsUse, listener.tlsRequire, listener.tlsPfx, listener.socketSpeedLimit, listener.protectUse);
}