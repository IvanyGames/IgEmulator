var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')

exports.module = function (stanza) {

	var profileObject = global.users.jid[stanza.attrs.from];

	if (!profileObject) {
		//console.log("["+stanza.attrs.from+"][GetExpiredItems]:Profile not found");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
		return;
	}

	//global.db.warface.profiles.findOne({ username: profileObject.username }, { projection: { "notifications": 1 } }, function (errProfile, resultProfile) {

		var elementGetExpiredItems = new ltxElement("get_expired_items");

		var expiresArr = [];

		scriptProfile.getExpiredItems(profileObject, expiresArr);

		//test notifs

		/*var currentTimeUtc = Math.round((new Date().getTime()) / 1000);
		for (var i = 0; i < resultProfile.notifications.length; i++) {
			var notificationInfo = resultProfile.notifications[i];
			var notificationObjectInfo = scriptProfile.notificationsObject[notificationInfo.type];

			if (!notificationObjectInfo) {
				//console.log("["+stanza.attrs.from+"][JoinChannel]:Notification id: '"+notificationInfo.id+"', type: '"+notificationInfo.type+"' in not found in notificationsObject");
				continue;
			}

			if (!notificationObjectInfo.validateParams(notificationInfo.params)) {
				//console.log("["+stanza.attrs.from+"][JoinChannel]:Notification id: '"+notificationInfo.id+"', failed to validate params");
				continue;
			}

			if (notificationInfo.expirationTime - currentTimeUtc <= 0) {
				console.log("[" + stanza.attrs.from + "][JoinChannel]:Notification id: '" + notificationInfo.id + "', is expired, PLS RELEASE SYSTEM FOR DELETE THIS NOTIFICATION");
			}

			var elementNotif = elementGetExpiredItems.c("notif", { id: notificationInfo.id, type: notificationInfo.type, confirmation: (notificationInfo.id ? 1 : 0), from_jid: global.config.masterserver.username + "@" + global.config.masterserver.domain + "/" + global.startupParams.resource, message: "", seconds_left_to_expire: notificationInfo.expirationTime - currentTimeUtc });
			elementNotif.children.push(notificationObjectInfo.parseParams(notificationInfo.params));
		}*/

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

	//});
}