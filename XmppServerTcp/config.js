module.exports = {
	"listenersClient": [{
		"host": "127.0.0.1",
		"port": 5224,
		"domain": "warface",
		"tlsUse": false,
		"tlsRequire": false,
		"tlsKey": null,
		"tlsCert": null,
		"socketSpeedLimit": -1
	},
	{
		"host": "0.0.0.0",
		"port": 5222,
		"domain": "warface",
		"tlsUse": true,
		"tlsRequire": true,
		"tlsKey": "./cert.key",
		"tlsCert": "./cert.crt",
		"socketSpeedLimit": -1
	}
	],
	"listenersComponent": [{
		"host": "127.0.0.1",
		"port": 5347,
		"domain": "warface"
	}
	],

	"connectionsUnauthorizedTimeout": 30,

	"pingEnable": true,
	"pingInterval": 30,
	"pingAnonceToMasterservers": false,

	"authAllowAnyone": false,

	"authByActiveTokenEnable": false,

	"localAccounts": {
		"masterserver": { "password": "W8o9YQ7ED5rtsowPlwuoAmJcCVjcqc8B", "allowBindCustomResource": true, "admin": true },
		"dedicated": { "password": "iTDki2ww7XaqtmqYl3maju6rxWMrVrHR", "allowBindCustomResource": true, "admin": false }
	},
	"componentsInfo": {
		"wfc.warface": "yrb8fFNeJMdCFkYV0qUi5jWclFedJVJp",
		"conference.warface": "Me1YRtd5E7NXT8CKiY7jT5cwg7DgOu3x",
	},
	"api": {
		"host": "127.0.0.1",
		"port": 8080
	}
};