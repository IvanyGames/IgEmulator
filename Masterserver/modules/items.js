var ltxElement = require('ltx').Element

exports.moduleNew = function (stanza) {

	var from = Number(stanza.children[0].children[0].attrs.from);
	var to = Number(stanza.children[0].children[0].attrs.to);
	var hash = stanza.children[0].children[0].attrs.hash;
	var cached = stanza.children[0].children[0].attrs.cached;

	var elementItems = new ltxElement("items", { code: 1, from: 0, to: 0, hash: global.resources.items.hash });

	if (cached != global.resources.items.hash) {
		if (Number.isNaN(from) || from < 0) {
			from = 0;
		}

		if (Number.isNaN(to) || to <= from) {
			to = from + 250;
		}

		if (to >= global.resources.items.data.length) {
			to = global.resources.items.data.length;
			elementItems.attrs.code = 3;
		} else {
			elementItems.attrs.code = 2;
		}

		elementItems.attrs.from = from;
		elementItems.attrs.to = to;

		for (var i = from; i < to; i++) {
			var itemInfo = global.resources.items.data[i];
			elementItems.c("item", { id: itemInfo.id, name: itemInfo.name, locked: itemInfo.locked, max_buy_amount: itemInfo.max_buy_amount });
		}

	}

	global.xmppClient.response(stanza, elementItems);
}

exports.moduleOld = function (stanza) {

	var received = Number(stanza.children[0].children[0].attrs.received);
	var token = stanza.children[0].children[0].attrs.token;
	var cancelled = stanza.children[0].children[0].attrs.cancelled;
	var hash = Number(stanza.children[0].children[0].attrs.hash);
	var size = Number(stanza.children[0].children[0].attrs.size);

	if (Number.isNaN(received) || received < 0 || Number.isNaN(size) || size < 0) {
		//console.log("["+stanza.attrs.from+"][Items]:Incorrect attributes");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	var elementItems = new ltxElement("items", { left: 0, token: 0 });

	if (hash != global.resources.items.hashOld) {

		var end_i = received + size;

		if (end_i >= global.resources.items.data.length) {
			end_i = global.resources.items.data.length;
		}

		elementItems.attrs.left = global.resources.items.data.length - end_i;

		for (var i = received; i < end_i; i++) {
			var itemInfo = global.resources.items.data[i];
			elementItems.c("item", { id: itemInfo.id, name: itemInfo.name, locked: itemInfo.locked, max_buy_amount: itemInfo.max_buy_amount });
		}

	}

	global.xmppClient.response(stanza, elementItems);
}

exports.module = function (stanza) {

	if (stanza.children[0].children[0].attrs.size) {
		exports.moduleOld(stanza);
		return;
	}

	exports.moduleNew(stanza);
}