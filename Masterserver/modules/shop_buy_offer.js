var ltxElement = require('ltx').Element
var scriptProfile = require('../scripts/profile.js')
var scriptTools = require('../scripts/tools.js')

exports.module = function (stanza) {
    
    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][ShopBuyOffer]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "5" });
        return;
    }

    var offer_id = stanza.children[0].children[0].attrs.offer_id;
    var hash = stanza.children[0].children[0].attrs.hash;

    if (offer_id) {
        stanza.children[0].children[0].c("offer", { id: offer_id });
    }

    var elementShopBuyOffer = new ltxElement(stanza.children[0].children[0].name, { offer_id: offer_id, error_status: "0" });

    if (hash != global.cache.shop.hash) {
        elementShopBuyOffer.attrs.error_status = "9";
        global.xmppClient.response(stanza, elementShopBuyOffer);
        return;
    }

    var elementPurchasedItem = elementShopBuyOffer.c("purchased_item");

    var itemsToGiveArr = [];

    var elementOfferArr = stanza.children[0].children[0].getChildren("offer");
    for (var i = 0; i < elementOfferArr.length; i++) {
        var offerId = elementOfferArr[i].attrs.id;
        var offerShopInfo = global.CacheQuickAccess.shopOffersObject.id[offerId];

        if (!offerShopInfo) {
            elementShopBuyOffer.attrs.error_status = "6";
            continue;
        }

        if (offerShopInfo.rank > scriptTools.getLevelByExp(profileObject.experience)) {
            elementShopBuyOffer.attrs.error_status = "5";
            continue;
        }

        if (profileObject.game_money - offerShopInfo.game_price < 0 || profileObject.cry_money - offerShopInfo.cry_price < 0 || profileObject.crown_money - offerShopInfo.crown_price < 0) {
            elementShopBuyOffer.attrs.error_status = "1";
            continue;
        }

        if (offerShopInfo.key_item_name) {

            var itemIndex = profileObject.items.findIndex(function (x) { return x.name == offerShopInfo.key_item_name });
            var itemObject = profileObject.items[itemIndex];

            if (itemIndex == -1 || itemObject.expired_confirmed != 0) {
                elementShopBuyOffer.attrs.error_status = "8";
                continue;
            }

            profileObject.items.splice(itemIndex, 1);

            scriptProfile.giveNotifications(profileObject.username, [{ type: 2097152, params: { profile_item_id: itemObject.id } }], function (nAddResultTarget) {

            });
        }

        profileObject.game_money -= offerShopInfo.game_price;
        profileObject.cry_money -= offerShopInfo.cry_price;
        profileObject.crown_money -= offerShopInfo.crown_price;

        //console.log(profileObject.cry_money, offerShopInfo.cry_price)

        itemsToGiveArr.push({ name: offerShopInfo.name, durabilityPoints: offerShopInfo.durabilityPoints, expirationTime: offerShopInfo.expirationTime, quantity: offerShopInfo.quantity, offerId: offerShopInfo.id });
    }

    scriptProfile.giveGameItem(profileObject, itemsToGiveArr, false, elementPurchasedItem.children, null);

    elementShopBuyOffer.c("money", { game_money: profileObject.game_money, cry_money: profileObject.cry_money, crown_money: profileObject.crown_money });
    global.xmppClient.response(stanza, elementShopBuyOffer);
}

//1-Недостаточно денег
//2-Произошла ошибка, попробуйте позже
//3-Товар закончился
//4-Этот предмет уже есть у вас на складе
//5-
//6-
//7-
//8-
//9-
//10-

//1-Недостаточно средств для проведения данной операции
//2-Ошибка
//3-Данный товар сейчас недоступен, на него слишком большой спрос, попробуйте преобрести позже
//4-Этот предмет уже есть у вас на складе
//5-Ошибка
//6-Покупка невозможна
//7-Ошибка
//8-Предложение больше не действует
//9-Магазин обновлён, приносим извенения
//10-Ошибка
//11-Ошибка
//12-Resync profile???
//13-Ошибка