var ltxElement = require('ltx').Element

exports.module = function (stanza) {

	var from = Number(stanza.children[0].children[0].attrs.from);
	var to = Number(stanza.children[0].children[0].attrs.to);
	var hash = stanza.children[0].children[0].attrs.hash;
	var cached = stanza.children[0].children[0].attrs.cached;

	var elementItems = new ltxElement("items", { code: 1, from: 0, to: 0, hash: global.cacheJson.items.hash });

	if (cached != global.cacheJson.items.hash) {
		if (Number.isNaN(from) || from < 0) {
			from = 0;
		}

		if (Number.isNaN(to) || to <= from) {
			to = from + 250;
		}

		if (to >= global.cacheJson.items.data.length) {
			to = global.cacheJson.items.data.length;
			elementItems.attrs.code = 3;
		} else {
			elementItems.attrs.code = 2;
		}

		elementItems.attrs.from = from;
		elementItems.attrs.to = to;

		for (var i = from; i < to; i++) {
			var itemInfo = global.cacheJson.items.data[i];
			elementItems.c("item", { id: itemInfo.id, name: itemInfo.name, locked: itemInfo.locked, max_buy_amount: itemInfo.max_buy_amount });
		}

	}

	//console.log("[" + stanza.attrs.from + "][Items]:Successfully");

	global.xmppClient.response(stanza, elementItems);
}