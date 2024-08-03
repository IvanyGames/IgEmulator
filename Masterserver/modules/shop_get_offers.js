var ltxElement = require('ltx').Element

exports.moduleNew = function (stanza) {

	var from = Number(stanza.children[0].children[0].attrs.from);
	var to = Number(stanza.children[0].children[0].attrs.to);
	var hash = stanza.children[0].children[0].attrs.hash;
	var cached = stanza.children[0].children[0].attrs.cached;

	var elementShopGetOffers = new ltxElement("shop_get_offers", { code: 1, from: 0, to: 0, hash: global.cache.shop.hash });

	if (cached != global.cache.shop.hash) {
		if (Number.isNaN(from) == true || from < 0) {
			from = 0;
		}

		if (Number.isNaN(to) == true || to <= from) {
			to = from + 250;
		}

		if (to >= global.cache.shop.data.length) {
			to = global.cache.shop.data.length;
			elementShopGetOffers.attrs.code = 3;
		} else {
			elementShopGetOffers.attrs.code = 2;
		}

		elementShopGetOffers.attrs.from = from;
		elementShopGetOffers.attrs.to = to;

		for (var i = from; i < to; i++) {
			var offerInfo = global.cache.shop.data[i];
			elementShopGetOffers.c("offer", offerInfo);
		}

	}

	global.xmppClient.response(stanza, elementShopGetOffers);
}

exports.moduleOld = function (stanza) {

	var received = Number(stanza.children[0].children[0].attrs.received);
	var token = stanza.children[0].children[0].attrs.token;
	var cancelled = stanza.children[0].children[0].attrs.cancelled;
	var hash = Number(stanza.children[0].children[0].attrs.hash);
	var size = Number(stanza.children[0].children[0].attrs.size);

	if (Number.isNaN(received) || received < 0 || Number.isNaN(size) || size < 0) {
		//console.log("["+stanza.attrs.from+"][ShopGetOffers]:Incorrect attributes");
		global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "2" });
		return;
	}

	var elementShopGetOffers = new ltxElement("shop_get_offers", { left: 0, token: 0 });

	if (hash != global.cache.shop.hashOld) {

		var end_i = received + size;

		if (end_i >= global.cache.shop.data.length) {
			end_i = global.cache.shop.data.length;
		}

		elementShopGetOffers.attrs.left = global.cache.shop.data.length - end_i;

		for (var i = received; i < end_i; i++) {
			var offerInfo = global.cache.shop.data[i];
			elementShopGetOffers.c("offer", offerInfo);
		}

	}

	global.xmppClient.response(stanza, elementShopGetOffers);
}

exports.module = function (stanza) {

	if (stanza.children[0].children[0].attrs.size) {
		exports.moduleOld(stanza);
		return;
	}

	exports.moduleNew(stanza);
}