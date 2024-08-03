var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][PersistentSettingsSet]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	var elementSettings = stanza.children[0].children[0].getChild("settings");

	if (!elementSettings) {
		//console.log("["+stanza.attrs.from+"][PersistentSettingsSet]:Incorrect packet");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var elementSettingAll = elementSettings.getChildElements();

	for (var i = 0; i < elementSettingAll.length; i++) {
		var elementSetting = elementSettingAll[i];

		var convertedAttrs = {};
		for (keyAttr in elementSetting.attrs) {
			convertedAttrs[keyAttr.split(".").join("*")] = elementSetting.attrs[keyAttr];
		}

		profileObject.persistent_settings[elementSetting.name] = convertedAttrs;
	}

	global.xmppClient.response(stanza, new ltxElement("persistent_settings_set"));
}