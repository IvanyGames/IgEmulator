module.exports = {
	"listenersClient": [{
		"host": "127.0.0.1",
		"port": 5224,
		"domain": "warface",
		"tlsUse": false,
		"tlsRequire": false,
		"tlsPfx": null,
		"protectUse": false,
		"socketSpeedLimit": -1
	},
	{
		"host": "0.0.0.0",
		"port": 5222,
		"domain": "warface",
		"tlsUse": true,
		"tlsRequire": true,
		"tlsPfx": "./cert.pfx",
		"protectUse": false,
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
	"connectionsInactivityCheckEnable": false,
	"connectionsInactivityCheckInterval": 1,
	"connectionsInactivityCheckTimeout": 300,

	"pingEnable": true,
	"pingInterval": 30,
	"pingAnonceToMasterservers": false,

	"authAllowAnyone": false,

	"authByActiveTokenEnable": true,

	"localAccounts": {
		"masterserver": { "password": "masterserver", "allowBindCustomResource": true, "admin": true, "authAllowedFromIps": ["127.0.0.1"] },
		"dedicated": { "password": "dedicated", "allowBindCustomResource": true, "admin": false, "authAllowedFromIps": null },
		"1": { "password": "1", "allowBindCustomResource": false, "admin": false, "authAllowedFromIps": null },
		"2": { "password": "2", "allowBindCustomResource": false, "admin": false, "authAllowedFromIps": null }
	},
	"componentsInfo": {
		"wfc.warface": "Hso1y5OWkiunPjQF",
		"conference.warface": "Bve6j7FVVcL38fwt"
	},
	"api": {
		"host": "127.0.0.1",
		"port": 8080,
		"allowedIps": [
			"127.0.0.1"
		]
	}
};