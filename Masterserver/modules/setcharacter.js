var ltxElement = require('ltx').Element
var scriptTools = require('../scripts/tools.js')

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][SetСharacter]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var height = Number(stanza.children[0].children[0].attrs.height);
	var gender = stanza.children[0].children[0].attrs.gender;
	var fatness = Number(stanza.children[0].children[0].attrs.fatness);
	var current_class = Number(stanza.children[0].children[0].attrs.current_class);

	if (Number.isNaN(height) || (gender != "male" && gender != "famale") || Number.isNaN(fatness) || profileObject.classes_unlocked.indexOf(current_class) == -1) {
		//console.log("["+stanza.attrs.from+"][SetСharacter]:Incorrect paket");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	profileObject.gender = gender;
	profileObject.current_class = current_class;

	var elementItems = stanza.children[0].children[0].getChildren("item");

	for (var i = 0; i < elementItems.length; i++) {

		var itemInfo = elementItems[i].attrs;

		var itemId = Number(itemInfo.id);
		if (Number.isNaN(itemId)) {
			continue;
		}

		var itemAttachedTo = itemInfo.attached_to;
		if (itemAttachedTo == null || itemAttachedTo.length > 128) {
			continue;
		}

		var itemSlot = Number(itemInfo.slot);
		if (Number.isNaN(itemSlot)) {
			continue;
		}

		var itemConfig = itemInfo.config;
		if (itemConfig == null || itemConfig.length > 128) {
			continue;
		}

		var itemIndex = profileObject.items.findIndex(function (x) { return x.id == itemId });

		if (itemIndex == -1) {
			continue;
		}

		var itemObject = profileObject.items[itemIndex];

		itemObject.attached_to = itemAttachedTo;
		itemObject.config = itemConfig;
		itemObject.slot = itemSlot;
		itemObject.equipped = scriptTools.getEquipped(itemSlot);
	}

	global.xmppClient.response(stanza, new ltxElement("setcharacter"));
}