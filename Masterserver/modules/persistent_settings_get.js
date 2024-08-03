var ltxElement = require('ltx').Element

exports.module = function (stanza) {
	
	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][PersistentSettingsGet]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var elementPersistentSettingsGet = new ltxElement("persistent_settings_get");

	for (keySetting in profileObject.persistent_settings) {
		var attrsSetting = profileObject.persistent_settings[keySetting];

		var convertedAttrs = {};
		for (keyAttr in attrsSetting) {
			convertedAttrs[keyAttr.split("*").join(".")] = attrsSetting[keyAttr];
		}

		elementPersistentSettingsGet.c(keySetting, convertedAttrs);
		elementPersistentSettingsGet.c("setting").c(keySetting, convertedAttrs);
	}

	global.xmppClient.response(stanza, elementPersistentSettingsGet);
}