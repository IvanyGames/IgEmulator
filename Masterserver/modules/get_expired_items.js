var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][GetExpiredItems]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	var elementGetExpiredItems = new ltxElement("get_expired_items");

	var expiresArr = [];

	scriptProfile.getExpiredItems(profileObject, expiresArr);

	if (expiresArr.length) {

		for (var i = 0; i < expiresArr.length; i++) {
			var expiredObject = expiresArr[i];
			elementGetExpiredItems.c("expired_item", expiredObject);
		}

		for (var i = 0; i < profileObject.items.length; i++) {
			elementGetExpiredItems.c("item", profileObject.items[i]);
		}

	} else {

		for (var i = 0; i < profileObject.items.length; i++) {

			var itemObject = profileObject.items[i];

			if (itemObject.expired_confirmed == 1) {
				continue;
			} else if (itemObject.durability_points != null) {
				elementGetExpiredItems.c("durability_item", itemObject);
			} else if (itemObject.quantity != null) {
				elementGetExpiredItems.c("consumable_item", itemObject);
			}


		}

	}

	global.xmppClient.response(stanza, elementGetExpiredItems);
}