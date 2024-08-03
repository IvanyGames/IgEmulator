var ltx = require("ltx");
var fs = require("fs");

var skipTestOffers = true;
exports.module = function (callback) {

	var usedStoreIds = [];

	var resultData = [];
	var dirData = fs.readdirSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/libs/config/Shop");
	for (var e = 0; e < dirData.length; e++) {
		var dirElementName = dirData[e];

		//Пропуск элементов, которые начинаются не с текста 'catalog'
		if (dirElementName.split("_")[0] != "catalog") {
			console.log("[CacheShop]:Skip '" + dirElementName + "' this is not a 'catalog' file!");
			continue;
		}

		//Пропуск элементов о которых не удалось получить информацию, или которые являются директориями
		try {
			if (fs.statSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/libs/config/Shop/" + dirElementName).isDirectory() == true) {
				console.log("[CacheShop]:Skip '" + dirElementName + "' this is directory!");
				continue;
			}
		} catch (err) {
			console.log("[CacheShop]:Skip '" + dirElementName + "' couldn't get information!");
			continue;
		}

		var fileData = null;
		try {
			fileData = fs.readFileSync("./gamedata/" + global.startupParams.locale + "_" + global.startupParams.version + "/libs/config/Shop/" + dirElementName, "utf8");
		} catch (err) {
			console.log("[CacheShop]:Skip '" + dirElementName + "' couldn't read!");
			continue;
		}

		var parsedData = null;
		try {
			parsedData = ltx.parse(fileData);
		} catch (err) {
			console.log("[CacheShop]:Skip '" + dirElementName + "' failed to parse!");
		}
		console.log("[CacheShop]:Caching file '" + dirElementName + "'");
		var fileNameCategorySection = dirElementName.split("_")[dirElementName.split("_").length - 1]
		if (skipTestOffers == true && fileNameCategorySection == "test.xml") {
			console.log("[CacheShop]:Skip '" + dirElementName + "' this is test offers!");
			continue;
		}
		var childrensOffer = parsedData.getChildren("offer");
		for (var i = 0; i < childrensOffer.length; i++) {
			var childOfferAttrs = childrensOffer[i].attrs;

			var itemId = Number(childOfferAttrs.store_id);
			var itemName = childOfferAttrs.item_name;

			var itemGamePrice = Number(childOfferAttrs.game_money);
			var itemCryPrice = Number(childOfferAttrs.cry_money);
			var itemCrownPrice = Number(childOfferAttrs.crown_money);

			var itemGamePriceOrigin = itemGamePrice;
			var itemCryPriceOrigin = itemCryPrice;
			var itemCrownPriceOrigin = itemCrownPrice;

			var itemKeyItemName = childOfferAttrs.key_item_name;
			if (itemKeyItemName == null) {
				itemKeyItemName = "";
			}

			var itemKeyItemPrice = Number(childOfferAttrs.key_item_money)
			if (Number.isNaN(itemKeyItemPrice) == true) {
				itemKeyItemPrice = 0;
			}

			var itemDurabilityPoints = Number(childOfferAttrs.durability_points)

			var itemRepairCost = Number(childOfferAttrs.repair_cost)
			if (Number.isNaN(itemRepairCost) == true) {
				itemRepairCost = 0;
			}

			var itemQuantity = Number(childOfferAttrs.quantity)

			var itemExpirationTimeShop = childOfferAttrs.expiration_time
			if (itemExpirationTimeShop != null && itemExpirationTimeShop != "" && itemExpirationTimeShop != "0") {
				var timeUnit = itemExpirationTimeShop[itemExpirationTimeShop.length - 1];
				var timeCount = itemExpirationTimeShop.slice(0, -1);
				switch (timeUnit) {
					case "d":
						itemExpirationTimeShop = timeCount + " day";
						break;
					case "h":
						itemExpirationTimeShop = timeCount + " hour";
						break;
					case "m":
						itemExpirationTimeShop = timeCount + " month";
						break;
					default:
						console.log("[CacheShop]:File '" + dirElementName + "' element '" + i + "' time unit '" + timeUnit + "' is unknown!");
						throw "";
				}

			} else {
				itemExpirationTimeShop = "";
			}

			var itemItemCategoryOverride = childOfferAttrs.item_category_override
			if (itemItemCategoryOverride == null) {
				itemItemCategoryOverride = "";
			}

			var itemOfferStatus = childOfferAttrs.offer_status

			var itemRefundable = Number(childOfferAttrs.refundable)
			if (Number.isNaN(itemRefundable) == true) {
				itemRefundable = 0;
			}

			var itemRank = Number(childOfferAttrs.rank)
			if (Number.isNaN(itemRank) == true) {
				itemRank = 0;
			}

			var itemDiscount = Number(childOfferAttrs.discount);
			if (Number.isNaN(itemDiscount) == false && itemDiscount > 0) {
				if (itemGamePrice > 0) {
					itemGamePrice = itemGamePrice - itemDiscount;
					if (itemGamePrice < 0) {
						itemGamePrice = 0;
					}
				}
				if (itemCryPrice > 0) {
					itemCryPrice = itemCryPrice - itemDiscount;
					if (itemCryPrice < 0) {
						itemCryPrice = 0;
					}
				}
				if (itemCrownPrice > 0) {
					itemCrownPrice = itemCrownPrice - itemDiscount;
					if (itemCrownPrice < 0) {
						itemCrownPrice = 0;
					}
				}
			} else {
				itemDiscount = 0;
			}

			if (usedStoreIds.indexOf(itemId) != -1) {
				console.log("[CacheShop]:Duplicate store_id " + itemId);
				throw "";
			}

			usedStoreIds.push(itemId);

			resultData.push({
				"id": itemId,
				"name": itemName,
				"game_price": itemGamePrice,
				"cry_price": itemCryPrice,
				"crown_price": itemCrownPrice,
				"game_price_origin": itemGamePriceOrigin,
				"cry_price_origin": itemCryPriceOrigin,
				"crown_price_origin": itemCrownPriceOrigin,
				"key_item_name": itemKeyItemName,
				"key_item_price": itemKeyItemPrice,
				"durabilityPoints": itemDurabilityPoints,
				"repair_cost": itemRepairCost,
				"quantity": itemQuantity,
				"expirationTime": itemExpirationTimeShop,
				"item_category_override": itemItemCategoryOverride,
				"offer_status": itemOfferStatus,
				"supplier_id": 1,
				"refundable": itemRefundable,
				"rank": itemRank,
				"discount": itemDiscount
			});
		}

	}
	callback(resultData);
}