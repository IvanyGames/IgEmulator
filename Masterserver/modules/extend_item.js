var ltxElement = require('ltx').Element

exports.module = function (stanza) {

    var profileObject = global.users.jid[stanza.attrs.from];

    if (!profileObject) {
        //console.log("[" + stanza.attrs.from + "][ExtendItem]:Profile not found");
        global.xmppClient.responseError(stanza, { type: 'continue', code: "8", custom_code: "1" });
        return;
    }

    var item_id = Number(stanza.children[0].children[0].attrs.item_id);
    var offer_id = stanza.children[0].children[0].attrs.offer_id;

    var elementExtendItem = new ltxElement("extend_item", { game_money: profileObject.game_money, cry_money: profileObject.cry_money, crown_money: profileObject.crown_money, error_status: "0" });

    var offerShopInfo = global.CacheQuickAccess.shopOffersObject.id[offer_id];

    if (!offerShopInfo || !offerShopInfo.expirationTime) {
        //console.log("[" + stanza.attrs.from + "][ExtendItem]:Offer not found");
        elementExtendItem.attrs.error_status = "3";
        global.xmppClient.response(stanza, elementExtendItem);
        return;
    }

    var itemObject = profileObject.items[profileObject.items.findIndex(function (x) { return (x.seconds_left != null && x.id == item_id && x.name == offerShopInfo.name) })];

    if (!itemObject) {
        //console.log("[" + stanza.attrs.from + "][ExtendItem]:Item not found");
        elementExtendItem.attrs.error_status = "2";
        global.xmppClient.response(stanza, elementExtendItem);
        return;
    }

    if (profileObject.game_money - offerShopInfo.game_price < 0 || profileObject.cry_money - offerShopInfo.cry_price < 0 || profileObject.crown_money - offerShopInfo.crown_price < 0) {
        //console.log("[" + stanza.attrs.from + "][ExtendItem]:Not enjoy money");
        elementExtendItem.attrs.error_status = "1";
        global.xmppClient.response(stanza, elementExtendItem);
        return;
    }

    var currentTimeUtc = Math.round((new Date().getTime()) / 1000);

    var expirationTimeSplited = offerShopInfo.expirationTime.split(" ");

    var expirationTimeNumber = 0;
    if (expirationTimeSplited[1] == "hour") {
        expirationTimeNumber = Number(expirationTimeSplited[0]) * 3600;
    } else if (expirationTimeSplited[1] == "day") {
        expirationTimeNumber = Number(expirationTimeSplited[0]) * 86400;
    } else if (expirationTimeSplited[1] == "month") {
        expirationTimeNumber = Number(expirationTimeSplited[0]) * 2419200;
    } else {
        //console.log("[" + stanza.attrs.from + "][ExtendItem]:Expiration time is undefined");
        elementExtendItem.attrs.error_status = "4";
        global.xmppClient.response(stanza, elementExtendItem);
        return;
    }

    if (itemObject.expiration_time_utc - currentTimeUtc > 0) {
        itemObject.expiration_time_utc = itemObject.expiration_time_utc + expirationTimeNumber;
    } else {
        itemObject.expiration_time_utc = currentTimeUtc + expirationTimeNumber;
    }
    itemObject.seconds_left = itemObject.expiration_time_utc - currentTimeUtc;
    itemObject.expired_confirmed = 0;

    profileObject.game_money -= offerShopInfo.game_price;
    profileObject.cry_money -= offerShopInfo.cry_price;
    profileObject.crown_money -= offerShopInfo.crown_price;

    elementExtendItem.attrs.game_money = profileObject.game_money;
    elementExtendItem.attrs.cry_money = profileObject.cry_money;
    elementExtendItem.attrs.crown_money = profileObject.crown_money;
    elementExtendItem.attrs.expiration_time_utc = itemObject.expiration_time_utc;
    elementExtendItem.attrs.seconds_left = itemObject.seconds_left;
    elementExtendItem.attrs.hours_left = Math.round(itemObject.seconds_left / 3600);

    global.xmppClient.response(stanza, elementExtendItem);
}