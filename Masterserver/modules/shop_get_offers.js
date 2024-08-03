var ltxElement = require('ltx').Element

exports.module = function (stanza) {

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

	//console.log("[" + stanza.attrs.from + "][ShopGetOffers]:Successfully");

	global.xmppClient.response(stanza, elementShopGetOffers);
}